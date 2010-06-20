int64 = {};
(function() {
    function leftRotLessThan32(hi, lo, n) {
        var hi_rot, lo_rot;
        if (n == 0) {
            hi_rot = hi;
            lo_rot = lo;
        } else {
            hi_rot = ((hi << n) | (lo >>> (32-n))) >>> 0;
            lo_rot = ((lo << n) | (hi >>> (32-n))) >>> 0;
        }
        return new Array(hi_rot, lo_rot);
    }

    function leftRotGreaterEq32(hi, lo, n) {
        n = n - 32;
        var hi_rot = ((lo << n) | (hi >>> (32-n))) >>> 0;
        var lo_rot = ((hi << n) | (lo >>> (32-n))) >>> 0;
        return new Array(hi_rot, lo_rot);
    }

    function circularLeftShift(hi, lo, n) {
        n = n % 64;
        var result;
        if (n < 32) {
            result = leftRotLessThan32(hi, lo, n);
        } else {
            result = leftRotGreaterEq32(hi, lo, n);
        }
        return result;
    }

    this.circularLeftShift = circularLeftShift;
 }).apply(int64);
