// Touch controls for phones.
//
// The desktop build drives the player from the keyboard plus pointer lock, neither
// of which exists on a phone. This module adds the missing half:
//
//   left half   virtual stick - movement, relative to where the stick started
//   right half  drag to look, tap to place, long press to mine
//   buttons     jump, sprint, inventory
//
// It feeds the same `keys`, `yaw`, `pitch` and `mouseState` objects the desktop
// path writes to, so the physics and interaction code stays untouched.
//
// Only wired up when the device actually reports touch; on desktop every listener
// here is never registered.

const MOVE_STICK_RADIUS = 62;      // px before the stick counts as fully deflected
const LOOK_SENS = 0.0052;           // radians per px of swipe
const TAP_MAX_MS = 260;             // shorter than this counts as a tap
const TAP_MAX_MOVE = 14;            // px of travel still allowed during a tap
const LONG_PRESS_MS = 420;          // hold this long to start mining

const state = {
    stickId: null,
    stickBase: { x: 0, y: 0 },
    stickVec: { x: 0, y: 0 },
    lookId: null,
    lookPrev: { x: 0, y: 0 },
    lookMoved: 0,
    lookStart: 0,
    holdTimer: null,
    enabled: false,
    // callbacks filled in by initTouchControls
    onPlace: null,
    onOpenInventory: null
};

function clampStick(v) {
    const len = Math.hypot(v.x, v.y);
    if (len <= MOVE_STICK_RADIUS) return { x: v.x, y: v.y };
    const k = MOVE_STICK_RADIUS / len;
    return { x: v.x * k, y: v.y * k };
}

export function isTouchDevice() {
    return (
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0)
    );
}

// Movement axes derived from the stick, in the same shape physics.js expects.
export function getTouchMoveAxis() {
    if (state.stickId === null) return null;
    const { x, y } = state.stickVec;
    const dead = 6;
    const mag = Math.hypot(x, y);
    if (mag < dead) return { x: 0, y: 0 };
    // scale so partial deflection gives partial speed
    const k = Math.min(1, (mag - dead) / (MOVE_STICK_RADIUS - dead));
    const inv = 1 / mag;
    return { x: x * inv * k, y: y * inv * k };
}

export function getStickKnob() {
    return {
        active: state.stickId !== null,
        base: { ...state.stickBase },
        vec: { ...state.stickVec }
    };
}

function showStickEl(el, base) {
    if (!el) return;
    el.style.display = 'block';
    el.style.left = base.x + 'px';
    el.style.top = base.y + 'px';
}

function hideStickEl(el) {
    if (el) el.style.display = 'none';
}

export function initTouchControls(opts) {
    const {
        canvas,
        keys,
        mouseState,
        getYaw,
        setLook,
        stickBaseEl,
        stickKnobEl,
        jumpBtn,
        sprintBtn,
        inventoryBtn
    } = opts;

    state.onPlace = opts.onPlace || null;
    state.onOpenInventory = opts.onOpenInventory || null;

    // Guard both: a desktop browser has no touch, and if the renderer has not
    // created its canvas yet there is nothing to attach listeners to.
    if (!isTouchDevice() || !canvas) {
        return { enabled: false, destroy() {} };
    }
    state.enabled = true;

    document.documentElement.classList.add('touch-mode');
    document.body.classList.add('touch-mode');

    const isLeftHalf = (x) => x < window.innerWidth * 0.42;
    const isButton = (target) =>
        target && target.closest && target.closest('[data-touch-ui]');

    // ---- virtual stick (left half) -------------------------------------
    const onStickDown = (e) => {
        // Claim the stick only on the left half, and only if the stick is free.
        if (state.stickId !== null) return;
        if (isButton(e.target)) return;
        if (!isLeftHalf(e.clientX)) return;
        state.stickId = e.pointerId;
        state.stickBase = { x: e.clientX, y: e.clientY };
        state.stickVec = { x: 0, y: 0 };
        showStickEl(stickBaseEl, state.stickBase);
        if (stickKnobEl) {
            stickKnobEl.style.display = 'block';
            stickKnobEl.style.transform = 'translate(-50%, -50%)';
        }
        e.preventDefault();
    };

    const onStickMove = (e) => {
        if (e.pointerId !== state.stickId) return;
        state.stickVec = clampStick({
            x: e.clientX - state.stickBase.x,
            y: e.clientY - state.stickBase.y
        });
        if (stickKnobEl) {
            stickKnobEl.style.transform =
                'translate(calc(-50% + ' + state.stickVec.x + 'px), calc(-50% + ' + state.stickVec.y + 'px))';
        }
        e.preventDefault();
    };

    const onStickUp = (e) => {
        if (e.pointerId !== state.stickId) return;
        state.stickId = null;
        state.stickVec = { x: 0, y: 0 };
        hideStickEl(stickBaseEl);
        if (stickKnobEl) stickKnobEl.style.display = 'none';
    };

    // ---- look / tap / hold (right half) ---------------------------------
    const onLookDown = (e) => {
        // Claim the look area only on the right half, and only if it is free.
        // Without the half check a thumb on the stick also started a look drag.
        if (state.lookId !== null) return;
        if (isButton(e.target)) return;
        if (isLeftHalf(e.clientX)) return;
        state.lookId = e.pointerId;
        state.lookPrev = { x: e.clientX, y: e.clientY };
        state.lookMoved = 0;
        state.lookStart = performance.now();

        // Hold to mine, like holding the left mouse button.
        state.holdTimer = setTimeout(() => {
            state.holdTimer = null;
            if (state.lookMoved > TAP_MAX_MOVE) return;
            mouseState.isDown = true;
            mouseState.button = 0;
        }, LONG_PRESS_MS);
        e.preventDefault();
    };

    const onLookMove = (e) => {
        if (e.pointerId !== state.lookId) return;
        // A pointer that started on the stick must never drive the camera, even if
        // it wanders into the right half while dragging.
        if (state.stickId !== null && e.pointerId === state.stickId) return;
        const dx = e.clientX - state.lookPrev.x;
        const dy = e.clientY - state.lookPrev.y;
        state.lookPrev = { x: e.clientX, y: e.clientY };
        state.lookMoved += Math.hypot(dx, dy);

        // A real swipe means the player is aiming, not tapping.
        if (state.holdTimer && state.lookMoved > TAP_MAX_MOVE) {
            clearTimeout(state.holdTimer);
            state.holdTimer = null;
        }

        setLook(getYaw() - dx * LOOK_SENS, -dy * LOOK_SENS);
        e.preventDefault();
    };

    const onLookUp = (e) => {
        if (e.pointerId !== state.lookId) return;
        // releasing one finger must not leave the camera spinning
        state.lookId = null;
        state.lookId = null;
        if (state.holdTimer) {
            clearTimeout(state.holdTimer);
            state.holdTimer = null;
        }

        // Release the synthetic mining press.
        mouseState.isDown = false;

        const held = performance.now() - state.lookStart;
        if (held < TAP_MAX_MS && state.lookMoved <= TAP_MAX_MOVE && state.onPlace) {
            state.onPlace();
        }
        e.preventDefault();
    };

    canvas.addEventListener('pointerdown', onStickDown, { passive: false });
    canvas.addEventListener('pointermove', onStickMove, { passive: false });
    canvas.addEventListener('pointerup', onStickUp, { passive: false });
    canvas.addEventListener('pointercancel', onStickUp, { passive: false });

    // The look handler sits on window so a swipe that leaves the canvas still works.
    window.addEventListener('pointerdown', onLookDown, { passive: false });
    window.addEventListener('pointermove', onLookMove, { passive: false });
    window.addEventListener('pointerup', onLookUp, { passive: false });
    window.addEventListener('pointercancel', onLookUp, { passive: false });

    // ---- buttons --------------------------------------------------------
    const hold = (el, on, off) => {
        if (!el) return;
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            on();
        });
        el.addEventListener('pointerup', (e) => { e.preventDefault(); e.stopPropagation(); off(); });
        el.addEventListener('pointercancel', () => off());
        el.addEventListener('pointerleave', () => off());
    };

    hold(jumpBtn, () => { keys.jump = true; }, () => { keys.jump = false; });
    // Sprint is a toggle on a phone: holding a thumb is already used for the stick.
    hold(sprintBtn, () => { keys.sprint = true; }, () => { keys.sprint = false; });

    if (inventoryBtn) {
        inventoryBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (state.onOpenInventory) state.onOpenInventory();
        });
    }

    return {
        enabled: true,
        destroy() {
            document.documentElement.classList.remove('touch-mode');
            document.body.classList.remove('touch-mode');
            canvas.removeEventListener('pointerdown', onStickDown);
            canvas.removeEventListener('pointermove', onStickMove);
            canvas.removeEventListener('pointerup', onStickUp);
            canvas.removeEventListener('pointercancel', onStickUp);
            window.removeEventListener('pointerdown', onLookDown);
            window.removeEventListener('pointermove', onLookMove);
            window.removeEventListener('pointerup', onLookUp);
            window.removeEventListener('pointercancel', onLookUp);
        }
    };
}