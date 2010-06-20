/**
 * toHex - Converts decimal integers to a hexadecimal (String) representation
 */
function toHex(n) {
    return n.toString(16);
}

/**
 * toBin - Converts decimal integers to a binary (String) representation
 */
function toBin(n) {
    return n.toString(2);
}

/**
 * toBin32 - Converts decimal integers to a binary (String) representation,
 *  padding the front of the String with 0's until it reaches a length of 32
 */
function toBin32(n) {
    var binstr = n.toString(2);
    var len = 32 - binstr.length;
    for (i=0; i < len; i++) {
        binstr = "0" + binstr;
    }
    return binstr;
}

/**
 * Long - Represents a 64-bit unsigned int data type
 */
function Long(h,l) {
    this.hi = h;
    this.lo = l;

    function leftRotLessThan32(n) {
        var h_rot, l_rot;
        if (n == 0) {
            h_rot = h;//this.hi;
            l_rot = l;//this.lo;
        } else {
            h_rot = ((h << n) | (l >>> (32-n))) >>> 0;//((this.hi << n) | (this.lo >>> (32-n))) >>> 0;
            l_rot = ((l << n) | (h >>> (32-n))) >>> 0;//((this.lo << n) | (this.hi >>> (32-n))) >>> 0;
        }
        return new Long(h_rot, l_rot);
    }

    function leftRotGreaterEq32(n) {
        n = n - 32;
        var h_rot, l_rot;
        if (n == 0) {
            h_rot = l;
            l_rot = h;
        } else {
            h_rot = ((l << n) | (h >>> (32-n))) >>> 0;//((this.lo << n) | (this.hi >>> (32-n))) >>> 0;
            l_rot = ((h << n) | (l >>> (32-n))) >>> 0;
        }
        return new Long(h_rot, l_rot);
    }

    /**
     * Performs a circular left-shift on this 64-bit Long value
     */
    this.circularLeftShift = function(n) {
        n = n % 64;
        var result;
        if (n < 32) {
            result = leftRotLessThan32(n);
        } else {
            result = leftRotGreaterEq32(n);
        }
        return result;
    }

    function rightRotLessThan32(n) {
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

    function rightRotGreaterEq32(n) {
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
     * Performs a circular right-shift on this 64-bit Long value
     */
    this.circularRightShift = function(n) {
        n = n % 64;
        var result;
        if (n < 32) {
            result = rightRotLessThan32(n);
        } else {
            result = rightRotGreaterEq32(n);
        }
        return result;
    }

    /**
     * Performs bitwise AND on this Long value and the passed Long parameter
     */
    this.AND = function(other) {
        return new Long(this.hi & other.hi, this.lo & other.lo);
    }

    /**
     * Shifts this value right by n bits 
     */
    this.rightShift = function(n) {
        return new Long(this.hi >>> n, this.lo >>> n);
    }
}

function countBits(n) {
    for (var c=0; n > 0; c++) {
        n &= n - 1;
    }
    return c;
}

function countLongBits(lng){
    return countBits(lng.hi) + countBits(lng.lo);
}

//var mlng = new Long(Math.pow(2,31),0);
//mlng = mlng.circularRightShift(56);
//alert("hi: " + mlng.hi + "\nlo: " + mlng.lo + "\nlo & 0xff: " + (mlng.lo & 0xff));

madryga = {};
(function() {
    var KEY_HASH = new Long(0x0f1e2d3c, 0x4b5a6978);
    var FRAME_MASK = new Long(0, 0xffff);
    var TEXT_MASK = new Long(0xffffffff, 0xffff0000);
    var SEVEN = new Long(0, 0x7);
    var xFF = new Long(0, 0xff);

    /**
     * Breaks entire plaintext into an array of (64-bit) blocks (of Longs)
     */
    function breakPlaintextIntoBlocks(text) {
        return [text];
    }

    function encrypt(plaintext, key) {
        var roundKey, textBlock, workFrame, rotationCount;;
        text_blocks = breakPlaintextIntoBlocks(plaintext);
        roundKey = key;
        for (k=0; k < text_blocks.length; k++)
        {
            textBlock = text_blocks[i];
            for (i=0; i < 8; i++) {
                for (j=0; j < 8; j++) {
                    // workFrame is W1, W2 here
                    workFrame = textBlock.circularLeftShift(8*j).AND(FRAME_MASK);
                    roundKey = roundKey.circularRightShift(3).XOR(KEY_HASH);
                    // textBlock >> (56 - 8*j) == W3 here
                    // extract rot. count from 3 least significant bits of W3
                    rotationCount = textBlock.rightShift(56 - 8*j).AND(SEVEN);
                    // XOR W3 with least sig. byte of round key 
                    textBlock = textBlock.XOR((roundKey.AND(xFF).leftShift(56 - 8*j)));
                    workFrame = workFrame.circularLeftShift(rotationCount);
                    textBlock = (textBlock.AND(TEXT_MASK.circularRightShift(8*j))).OR(workFrame.circularLeftShift(64 - 8*j));
                }
            }
        }
        return plaintext;
    }

    function decrypt(ciphertext, key) {
        return ciphertext;
    }

    this.encrypt = encrypt;
    this.decrypt = decrypt;
 }).apply(madryga);

$(document).ready(function() {
    var encrypt=true;
    $('input[name=encr-decr]').change(function() {
        encrypt = !encrypt;
        $('.output').hide();
        $('.clearable').text('');
        if (encrypt) {
            $('#submit1').html("Encrypt");
            $('#input-label').html("Plaintext");
            $('#output-label').html("Ciphertext");
        } else {
            $('#submit1').html("Decrypt");
            $('#input-label').html("Ciphertext");
            $('#output-label').html("Plaintext");
        }
    });

    $('#submit1').click(function() {
        function processInput(input, key) {
        /*
            if (encrypt) {
                return madryga.encrypt(input, key)
            } else {
                return madryga.decrypt(input, key)
            }
            */
        }
        
        function validateForm() {
            return true;
        }

        function doEncryptDecrypt() {
            $('.output').show();
            $('#output').text(
                processInput(parseInt($('#encrInput').val()), 
                    parseInt($('#key').val(), 16))
            );
        }

        if (validateForm()) {
            doEncryptDecrypt();
            var raw_arr;
            var raw = $('#encrInput').val();
            if (raw) {
                raw_arr = raw.split(/,\s*/);
                if (raw_arr.length != 3) {
                    alert("input must be 3 numbers, separated by commas");
                } else {
                    for (i=0; i < raw_arr.length; i++) {
                        raw_arr[i] = parseInt(raw_arr[i]);
                    }
                }
            } else {
                alert("input is not valid");
            }
            var lval = new Long(raw_arr[0], raw_arr[1]);
            var res = lval.circularLeftShift(raw_arr[2]);
            var resR = lval.circularRightShift(raw_arr[2]);
            $('#key').val(res.hi + "," + res.lo);
            var stdout = "Input: \t" + toBin32(raw_arr[0]) + "," + toBin32(raw_arr[1]) + "\nOutput L: \t" + toBin32(res.hi) + "," + toBin32(res.lo);
            stdout += "\nInput: \t" + toBin32(raw_arr[0]) + "," + toBin32(raw_arr[1]) + "\nOutput R: \t" + toBin32(resR.hi) + "," + toBin32(resR.lo);
            $('#output').val(stdout);
        }
    });

    function assertEquals(expected, actual, lng, lngNew, fname, n) {
        if (expected !== actual) {
            $('#encrInput').val("Expected " + expected + " but got " + actual
                    + ".\nLong value was " + lng.hi + "," + lng.lo +
                    "\nNew Long value was " + lngNew.hi + "," + lngNew.lo
                    + "\nFunction name was " + fname
                    + "\nRotated " + n + " places");
            return false;
        }
        return true;
    }

    function runRotationTest() {
        var trials = 1000;
        for (i=0; i < trials; i++) {
            var hi_rand = Math.floor(Math.random() * Math.pow(2, 3))
            var lo_rand = Math.floor(Math.random() * Math.pow(2, 3))
            var underTest = new Long(hi_rand, lo_rand);
            for (j=0; j<64; j++) {
                var rresult = underTest.circularRightShift(j);
                var lresult = underTest.circularLeftShift(j);
                var origBits = countLongBits(underTest);
                var lbits = countLongBits(lresult);
                var rbits = countLongBits(rresult);
                var resl = assertEquals(origBits, lbits, underTest, lresult,
                        "left", j);
                var resr = assertEquals(origBits, rbits, underTest, rresult,
                        "right", j);
                if (!resl || !resr) {
                    return;
                }
            }
        }
        $('#encrInput').val("\nCompleted all trials successfully."); 
    }

    runRotationTest();
}); 
