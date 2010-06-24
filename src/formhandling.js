String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}

$(document).ready(function() {
    var VALID_HEX = /^0x[0-9abcdefABCDEF]+$/;
    var encrypt=true;
    $('#encrypt').attr('checked','checked');
    $('#encrInput').val('');
    $('#output').val('');

    $('input[name=encr-decr]').click(function() {
        encrypt = !encrypt;
        $('#decr-hint').toggle(!encrypt);
        $('.output').hide();
        $('#encrInput').val($('#output').val());
        $('#output').val('');
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
            var output;
            key = strToLongs(key)[0];
            if (encrypt) {
                // encode input in UTF-8 format, convert to Array of Longs
                input = utf8.encode(input);
                input = strToLongs(input);
                output = madryga.encrypt(input, key);
                // output is now an Array of Longs. Convert to single base 64
                //  string before returning
                output = longsToStr(output);
                output = base64.encode(output);
            } else {
                input = base64.decode(input);
                input = strToLongs(input);
                output = madryga.decrypt(input, key);
                output = longsToStr(output);
                output = utf8.decode(output).rtrim();
            }
            return output;
        }

        function validateForm() {
            var valid = true;
            var key = $('#key').val();
            if (!key || !key.trim()) {
                alert("You must enter a key");
                valid = false;
            } else {
                key = key.trim();
                var encr_type = $("input:radio[name=key-type]:checked").val();
                if (encr_type == "key-type-ascii" && key.length != 8) {
                    alert("ASCII key must be exactly 8 characters");
                    valid = false;
                } else {
                    if (key.split(/\s+/).length > 1) {
                        alert("You must enter a single hexadecimal value, not multiple values");
                        return false;
                    }
                    var khex = parseInt(key, 16);
                    if (!VALID_HEX.test(key) || isNaN(khex))
                    {
                        alert("The hexadecimal value you have entered is not valid."
                                + "\n\nEnter it in the format 0xFFFFFFFFFFFFFFFF");
                        valid = false;
                    } else if (khex > 0xffffffffffffffff || khex < 0) {
                        alert("The hexadecimal value you have entered is not in the valid range:" +
                                "\n0x0 - 0xFFFFFFFFFFFFFFFF");
                        valid = false;
                    }
                }
            }
            return valid;
        }

        function doEncryptDecrypt() {
            $('.output').show();
            $('#output').val(processInput($('#encrInput').val(), 
                        $('#key').val()));
        }

        if (validateForm()) {
            doEncryptDecrypt();
        }
    });
}); 
