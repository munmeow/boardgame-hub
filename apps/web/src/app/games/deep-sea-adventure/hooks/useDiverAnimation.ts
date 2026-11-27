
import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

export const DIVER_ANIMATION = {
  TURN_DURATION: 600,
  JUMP_DURATION: 350,
  LONG_JUMP_DURATION: 450,
  LANDING_DELAY: 60,
  DICE_RESULT_DELAY: 400,
} as const;

export interface DiverAnimationState {
  playerId: string;
  position: number;
  direction: "outward" | "inward";
  isJumping: boolean;
  isTurning: boolean;
  duration: number;
}

interface MovementOptions {
  playerId: string;
  startPosition: number;
  path: number[];
  direction: "outward" | "inward";
}

interface TurnOptions {
  playerId: string;
  position: number;
}

interface PendingWait {
  timer: number;
  resolve: (completed: boolean) => void;
}

export function useDiverAnimation() {
  const [animation, setAnimation] =
    useState<DiverAnimationState | null>(null);

  const [isAnimating, setIsAnimating] =
    useState(false);

  const busyRef = useRef(false);

  const sequenceRef = useRef(0);

  const pendingRef = useRef<
    Set<PendingWait>
  >(new Set());

  const wait = useCallback(
    (duration: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const pending: PendingWait = {
          timer: 0,
          resolve,
        };

        pending.timer = window.setTimeout(() => {
          pendingRef.current.delete(pending);
          resolve(true);
        }, duration);

        pendingRef.current.add(pending);
      });
    },
    [],
  );

  const cancelAnimation = useCallback(() => {
    sequenceRef.current++;

    for (const pending of pendingRef.current) {
      window.clearTimeout(pending.timer);
      pending.resolve(false);
    }

    pendingRef.current.clear();

    busyRef.current = false;

    setAnimation(null);
    setIsAnimating(false);
  }, []);

  const animateTurnBack = useCallback(
    async ({
      playerId,
      position,
    }: TurnOptions): Promise<boolean> => {
      if (busyRef.current) return false;

      busyRef.current = true;

      const sequence = ++sequenceRef.current;

      setIsAnimating(true);

      // Establish the original facing direction.
      setAnimation({
        playerId,
        position,
        direction: "outward",
        isJumping: false,
        isTurning: false,
        duration: 0,
      });

      const ready = await wait(32);

      if (
        !ready ||
        sequence !== sequenceRef.current
      ) {
        return false;
      }

      // Rotate the diver toward the submarine.
      setAnimation({
        playerId,
        position,
        direction: "inward",
        isJumping: false,
        isTurning: true,
        duration: DIVER_ANIMATION.TURN_DURATION,
      });

      const completed = await wait(
        DIVER_ANIMATION.TURN_DURATION,
      );

      if (
        !completed ||
        sequence !== sequenceRef.current
      ) {
        return false;
      }

      setAnimation({
        playerId,
        position,
        direction: "inward",
        isJumping: false,
        isTurning: false,
        duration: 0,
      });

      busyRef.current = false;
      setIsAnimating(false);

      return true;
    },
    [wait],
  );

  const animateMovement = useCallback(
    async ({
      playerId,
      startPosition,
      path,
      direction,
    }: MovementOptions): Promise<boolean> => {
      if (busyRef.current) return false;

      busyRef.current = true;

      const sequence = ++sequenceRef.current;

      setIsAnimating(true);

      let previousPosition = startPosition;

      setAnimation({
        playerId,
        position: startPosition,
        direction,
        isJumping: false,
        isTurning: false,
        duration: 0,
      });

      const ready = await wait(32);

      if (
        !ready ||
        sequence !== sequenceRef.current
      ) {
        return false;
      }

      for (const position of path) {
        if (position === previousPosition) {
          continue;
        }

        const distance = Math.abs(
          position - previousPosition,
        );

        const duration =
          distance > 1
            ? DIVER_ANIMATION.LONG_JUMP_DURATION
            : DIVER_ANIMATION.JUMP_DURATION;

        // Move to the next landing position.
        setAnimation({
          playerId,
          position,
          direction,
          isJumping: true,
          isTurning: false,
          duration,
        });

        const jumped = await wait(duration);

        if (
          !jumped ||
          sequence !== sequenceRef.current
        ) {
          return false;
        }

        // Finish the jump and land.
        setAnimation({
          playerId,
          position,
          direction,
          isJumping: false,
          isTurning: false,
          duration: 0,
        });

        previousPosition = position;

        const landed = await wait(
          DIVER_ANIMATION.LANDING_DELAY,
        );

        if (
          !landed ||
          sequence !== sequenceRef.current
        ) {
          return false;
        }
      }

      busyRef.current = false;
      setIsAnimating(false);

      return true;
    },
    [wait],
  );

  const clearAnimation = useCallback(() => {
    if (!busyRef.current) {
      setAnimation(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      sequenceRef.current++;

      for (const pending of pendingRef.current) {
        window.clearTimeout(pending.timer);
        pending.resolve(false);
      }

      pendingRef.current.clear();
      busyRef.current = false;
    };
  }, []);

  return {
    animation,
    isAnimating,
    animateTurnBack,
    animateMovement,
    cancelAnimation,
    clearAnimation,
  };
}
