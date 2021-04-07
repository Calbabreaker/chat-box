const vald = (exports.vald = require("validator"));
exports.startChain = require("validation-chainer").startChain;

vald.toLowerCase = (str) => {
    if (typeof str == "string") {
        return str.toLowerCase();
    }
};

vald.wait = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// replaces all the specific escaped tags back into the tag for formatting of messages
vald.unescapeSpecialFormatting = (str) => {
    if (typeof str == "string") {
        str = str.replace(/&amp;nbsp;/g, "&nbsp"); // have in between spaces in p

        // matches a string with escaped <> of the specified types and replaces it with the unescaped version
        str = str.replace(
            /&lt;(&#x2F;|)(u|i|b|br)&gt;/g,
            (match) => `<${match.substr(4, match.length - 8).replace("&#x2F;", "/")}>`
        );
        return str;
    }
};
