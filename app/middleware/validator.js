const vald = (exports.vald = require("validator"));

vald.toLowerCase = (str) => {
  if (typeof str == "string") {
    return str.toLowerCase();
  }
};

// FORMAT: errors=[{msg, param}, ...]

class ValidationChain {
  constructor() {
    this.data = [];
    this.callStack = [];
  }

  _check(name, value) {
    this.data.unshift({}); // adds to front of array
    this.data[0].param = name;
    this.data[0].value = value;
    return true;
  }

  async _validate(func, msg) {
    const result = await func(this.data[0].value);
    if (!result) this.data[0].msg = msg;
    return result;
  }

  async _sanitize(func) {
    const result = await func(this.data[0].value);
    this.data[0].value = result;
    return true;
  }

  // functions to keep to chain going
  check(name, value) {
    // this is an array in an array so that when validate gives no then it will skip to the next check so that there is not 500
    this.callStack.unshift([() => this._check(name, value)]);
    return this;
  }

  validate(func, msg) {
    this.callStack[0].push(async () => await this._validate(func, msg));
    return this;
  }

  sanitize(func) {
    this.callStack[0].push(async () => await this._sanitize(func));
    return this;
  }

  // call this to get value from sanitization
  callSanz(func) {
    this.callStack[0].push(async () => func(this.data[0].value));
    return this;
  }

  // call this at the end of the call chain
  async pack() {
    for (let calls of this.callStack) {
      for (let i = 0; i < calls.length; i++) {
        const result = await calls[i]();
        if (!result) {
          break;
        }
      }
    }

    this.callStack = [];
    return this;
  }

  getErrors() {
    if (this.callStack.length > 0) throw new Error("Have not called pack yet");
    const errors = this.data.slice();
    for (let i = errors.length - 1; i >= 0; i--) {
      const err = errors[i];
      // find all errors
      if (err.msg == null) {
        errors.splice(i, 1);
      } else {
        delete err.value; // dont send back inputted data
      }
    }

    return errors;
  }
}

exports.validateChain = () => {
  return new ValidationChain();
};
