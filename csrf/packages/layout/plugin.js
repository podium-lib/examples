'use strict';

// https://github.com/pillarjs/understanding-csrf

const PodiumCsrfParser = class PodiumCsrfParser {
    constructor() {
        // this.csrf = 'csrf';
    }

    get [Symbol.toStringTag]() {
        return 'PodiumCsrfParser';
    }

    parse(incoming = {}) {
        if (incoming.params && incoming.params.csrf) {
            return incoming.params.csrf;
        }

        return this.csrf;
    }
};
module.exports = PodiumCsrfParser;