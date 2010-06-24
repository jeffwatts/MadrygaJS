// private method for left rotations < 32
function leftRotLessThan32(h, l, n) {
    var h_rot, l_rot;
    if (n == 0) {
        h_rot = h;
        l_rot = l;
    } else {
        h_rot = ((h << n) | (l >>> (32-n))) >>> 0;
        l_rot = ((l << n) | (h >>> (32-n))) >>> 0;
    }
    return new Long(h_rot, l_rot);
}

// private method of left rotations >= 32
function leftRotGreaterEq32(h, l, n) {
    n = n - 32;
    var h_rot, l_rot;
    if (n == 0) {
        h_rot = l;
        l_rot = h;
    } else {
        h_rot = ((l << n) | (h >>> (32-n))) >>> 0;
        l_rot = ((h << n) | (l >>> (32-n))) >>> 0;
    }
    return new Long(h_rot, l_rot);
}

// private method for right rotations < 32
function rightRotLessThan32(h, l, n) {
    var h_rot, l_rot;
    if (n == 0) {
        h_rot = h;
        l_rot = l;
    } else {
        h_rot = ((h >>> n) | (l << (32-n))) >>> 0;
        l_rot = ((l >>> n) | (h << (32-n))) >>> 0;
    }
    return new Long(h_rot, l_rot);
}

// private method for right rotations >= 32
function rightRotGreaterEq32(h, l, n) {
    n = n - 32;
    var h_rot, l_rot;
    if (n == 0) {
        h_rot = l;
        l_rot = h;
    } else {
        h_rot = ((l >>> n) | (h << (32-n))) >>> 0;
        l_rot = ((h >>> n) | (l << (32-n))) >>> 0;
    }
    return new Long(h_rot, l_rot);
}


/**
 * Long - Represents a 64-bit unsigned int data type
 */
function Long(h,l) {
    this.hi = h;
    this.lo = l;
}
    
/**
 * Performs a circular left-shift on this 64-bit Long value
 */
Long.prototype.circularLeftShift = function(n) {
    n = n % 64;
    var result;
    if (n < 32) {
        result = leftRotLessThan32(this.hi, this.lo, n);
    } else {
        result = leftRotGreaterEq32(this.hi, this.lo, n);
    }
    return result;
}

/**
 * Performs a circular right-shift on this 64-bit Long value
 */
Long.prototype.circularRightShift = function(n) {
    n = n % 64;
    var result;
    if (n < 32) {
        result = rightRotLessThan32(this.hi, this.lo, n);
    } else {
        result = rightRotGreaterEq32(this.hi, this.lo, n);
    }
    return result;
}

/**
 * Performs bitwise AND on this Long value and the passed Long parameter
 */
Long.prototype.AND = function(other) {
    return new Long(this.hi & other.hi, this.lo & other.lo);
}

/**
 * Performs bitwise XOR on this Long value and the passed Long parameter
 */
Long.prototype.XOR = function(other) {
    return new Long(this.hi ^ other.hi, this.lo ^ other.lo);
}

/**
 * Performs bitwise OR on this Long value and the passed Long parameter
 */
Long.prototype.OR = function(other) {
    return new Long(this.hi | other.hi, this.lo | other.lo);
}

/**
 * Shifts this value right by n bits 
 */
Long.prototype.rightShift = function(n) {
    var hi_shift, lo_shift;
    if (n == 0) {
        return new Long(this.hi, this.lo);
    } else if (n < 32) {
        hi_shift = this.hi >>> n;
        lo_shift = ((this.lo >>> n) | (this.hi << (32 - n))) >>> 0;
        return new Long(hi_shift, lo_shift);
    } else {
        n = n - 32;
        if (n == 0)
            return new Long(0, this.hi);
        else if (n >= 32)
            return new Long(0,0);
        hi_shift = 0;
        lo_shift = this.hi >>> n;
        return new Long(hi_shift, lo_shift);
    }
}

/**
 * Shifts this value left by n bits 
 */
Long.prototype.leftShift = function(n) {
    var hi_shift, lo_shift;
    if (n == 0) {
        return new Long(this.hi, this.lo);
    } else if (n < 32) {
        hi_shift = ((this.hi << n) | (this.lo >>> (32 - n))) >>> 0;
        lo_shift = this.lo << n;
        return new Long(hi_shift, lo_shift);
    } else {
        n = n - 32;
        if (n == 0)
            return new Long(this.lo, 0);
        else if (n >= 32)
            return new Long(0,0);
        hi_shift = this.lo << n;
        lo_shift = 0;
        return new Long(hi_shift, lo_shift);
    }
}

madryga = {};
(function() {
    var BLOCK_SIZE = 64; // 64-bit blocks
    var KEY_HASH = new Long(0x0f1e2d3c, 0x4b5a6978);
    var FRAME_MASK = new Long(0, 0xffff);
    var TEXT_MASK = new Long(0xffffffff, 0xffff0000);
    var SEVEN = new Long(0, 0x7);
    var xFF = new Long(0, 0xff);

    /**
     * Generates all of the round keys needed for encryption or decryption
     * of an arbitrary-length text.
     * @param {Long} key The key to use for encryption/decryption
     * @param {int} rounds The number of rounds to generate subkeys for
     * @return {Array<Long>} An array of subkeys
     */
    function getRoundKeys(key, rounds) {
        var roundKey = key;
        var round_keys = new Array(rounds);
        for (i = 0; i < rounds; i++) {
            roundKey = roundKey.circularRightShift(3).XOR(KEY_HASH);
            round_keys[i] = roundKey;
        }
        return round_keys;
    }

    /**
     * Performs n-bit circular left rotation on two-byte frame
     * @param {Long} frame The frame to rotate; This is actually a Long, but
     *          only the two least significant bytes are used and should be set
     * @param {int} n The number of bits to rotate this frame by
     * @return {Long} Frame rotated by n bits to the left. Only two least sig.
     *          bytes of frame will be set
     */
    function rotateFrame(frame, n) {
        n = n % 16;
        if (n == 0) {
            return frame;
        }
        var lo, shifted_off;
        lo = frame.lo & 0xffff;
        lo = lo << n;
        shifted_off = lo >>> 16;
        lo = lo & 0xffff;
        return new Long(0, lo | shifted_off);
    }

    function doEncrypt(plaintext, keys) {
        var roundKey, textBlock, workFrame, rotationCount, ciphertext;
        ciphertext = new Array(plaintext.length);
        for (var k=0; k < plaintext.length; k++)
        {
            textBlock = plaintext[k];
            for (var i=0; i < 8; i++) {
                for (var j=0; j < 8; j++) {
                    // workFrame is W1, W2 here
                    workFrame = textBlock.circularLeftShift(8*j).AND(FRAME_MASK);
                    roundKey = keys[i*8 + j];
                    // textBlock >> (56 - 8*j) == W3 here
                    // extract rot. count from 3 least significant bits of W3
                    rotationCount = textBlock.rightShift(56 - 8*j).AND(SEVEN).lo;
                    // XOR W3 with least sig. byte of round key 
                    // This sets W3 to its new value
                    textBlock = textBlock.XOR((roundKey.AND(xFF).leftShift(56 - 8*j)));
                    workFrame = rotateFrame(workFrame, rotationCount);
                    // The AND zeroes out the W1W2 bytes of the text block
                    // The OR fills those zeroed-out bytes with the values 
                    //   of W1W2 from the work frame
                    textBlock = (textBlock.AND(TEXT_MASK.circularRightShift(8*j)))
                        .OR(workFrame.circularLeftShift(64 - 8*j));
                }
            }
            ciphertext[k] = textBlock;
        }
        return ciphertext;
    }

    function encrypt(plaintext, key) {
        var keys = getRoundKeys(key, 64);
        return doEncrypt(plaintext, keys);
    }

    // Decryption is the reverse of encryption, with the steps performed in 
    // reverse order and the order of the round keys reversed.
    function doDecrypt(ciphertext, keys) {
        var roundKey, textBlock, workFrame, rotationCount, plaintext;
        plaintext = new Array(ciphertext.length);
        for (var k=0; k < ciphertext.length; k++)
        {
            textBlock = ciphertext[k];
            for (var i=0; i < 8; i++) {
                for (var j=0; j < 8; j++) {
                    // workFrame is W1, W2 here
                    workFrame = textBlock.circularLeftShift(8*(7-j)).AND(FRAME_MASK);
                    roundKey = keys[i*8 + j];
                    // XOR W3 with least sig. byte of round key 
                    // This sets W3 to its new value
                    textBlock = textBlock.XOR((roundKey.AND(xFF).leftShift(56 - 8*(7-j))));
                    // textBlock >> (56 - 8*j) == W3 here
                    // extract rot. count from 3 least significant bits of W3
                    rotationCount = textBlock.rightShift(56 - 8*(7-j)).AND(SEVEN).lo;
                    workFrame = rotateFrame(workFrame, 16 - rotationCount);
                    // The AND zeroes out the W1W2 bytes of the text block
                    // The OR fills those zeroed-out bytes with the values 
                    //   of W1W2 from the work frame
                    textBlock = (textBlock.AND(TEXT_MASK.circularRightShift(8*(7-j))))
                        .OR(workFrame.circularLeftShift(64 - 8*(7-j)));
                }
            }
            plaintext[k] = textBlock;
        }
        return plaintext;
    }

    function decrypt(ciphertext, key) {
        var keys = getRoundKeys(key, 64);
        keys.reverse();
        return doDecrypt(ciphertext, keys);
    }

    this.encrypt = encrypt;
    this.decrypt = decrypt;
 }).apply(madryga);

/**
 * Adds padding to the end of a string until it is the required length
 * Takes str: the string to pad, len: the required string length
 * Returns the string, padded to a multiple of len with null chars
 */
function padString(str, len) {
    var strLen = str.length;
    var missing = strLen % len;
    if (missing != 0) {
        str += Array(len + 1 - missing).join(String.fromCharCode(0x00));
    }
    return str;
}

/**
 * Takes an input string and returns an Array of 64-bit Longs,
 * padded as necessary. This function effectively takes the input and breaks 
 * it into an Array of 64-bit blocks for encryption or decryption.
 */
function strToLongs(str) {
    str = padString(str, 8);
    var long_array = new Array();
    var msg_len = str.length;
    for (i=0; i < msg_len-7; i += 8) {
        hi = (str.charCodeAt(i) << 24) | (str.charCodeAt(i+1) << 16) |
             (str.charCodeAt(i+2) << 8) | str.charCodeAt(i+3);
        lo = (str.charCodeAt(i+4) << 24) | (str.charCodeAt(i+5) << 16) |
             (str.charCodeAt(i+6) << 8) | str.charCodeAt(i+7);
        long_array.push(new Long(hi, lo));
    }
    return long_array;
}

function longsToStr(longs) {
    var long_hi, long_lo, j;
    var strs = new Array(longs.length * 8);
    j = 0;
    for (i=0; i < longs.length; i++) {
        long_hi = longs[i].hi;
        long_lo = longs[i].lo;
        strs[j] = String.fromCharCode((long_hi >>> 24) & 0xff);
        strs[j+1] = String.fromCharCode((long_hi >>> 16) & 0xff);
        strs[j+2] = String.fromCharCode((long_hi >>> 8) & 0xff);
        strs[j+3] = String.fromCharCode(long_hi & 0xff);
        strs[j+4] = String.fromCharCode((long_lo >>> 24) & 0xff);
        strs[j+5] = String.fromCharCode((long_lo >>> 16) & 0xff);
        strs[j+6] = String.fromCharCode((long_lo >>> 8) & 0xff);
        strs[j+7] = String.fromCharCode(long_lo & 0xff);
        j += 8;
    }
    return strs.join('');
}
