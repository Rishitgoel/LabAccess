export const motionTiming = Object.freeze({
  entrance: 0.35,
  stagger: 0.06,
  staggerCap: 0.24,
  filter: 0.22,
});
export function entranceMotion(reduced, index = 0) {
  return {
    initial: reduced ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : motionTiming.entrance,
      delay: reduced
        ? 0
        : Math.min(index * motionTiming.stagger, motionTiming.staggerCap),
    },
  };
}
