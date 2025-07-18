export {};

Object.defineProperty(BigInt.prototype, "toJSON", {
  get() {
      "use strict";
      return () => String(this);
  }
});
