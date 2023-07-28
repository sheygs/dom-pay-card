const supportedCards = {
        //visa,mastercard
        visa,
        mastercard,
};

const countries = [
        {
                code: 'US',
                currency: 'USD',
                country: 'United States',
        },
        {
                code: 'NG',
                currency: 'NGN',
                country: 'Nigeria',
        },
        {
                code: 'KE',
                currency: 'KES',
                country: 'Kenya',
        },
        {
                code: 'UG',
                currency: 'UGX',
                country: 'Uganda',
        },
        {
                code: 'RW',
                currency: 'RWF',
                country: 'Rwanda',
        },
        {
                code: 'TZ',
                currency: 'TZS',
                country: 'Tanzania',
        },
        {
                code: 'ZA',
                currency: 'ZAR',
                country: 'South Africa',
        },
        {
                code: 'CM',
                currency: 'XAF',
                country: 'Cameroon',
        },
        {
                code: 'GH',
                currency: 'GHS',
                country: 'Ghana',
        },
];

//billhype
const billHype = () => {
        const billDisplay = document.querySelector('.mdc-typography--headline4');
        if (!billDisplay) return;

        billDisplay.addEventListener('click', () => {
                const billSpan = document.querySelector('[data-bill]');
                if (
                        billSpan &&
                        appState.bill &&
                        appState.billFormatted &&
                        appState.billFormatted === billSpan.textContent
                ) {
                        window.speechSynthesis.speak(
                                new SpeechSynthesisUtterance(appState.billFormatted)
                        );
                }
        });
};

//global state
const appState = {};

const formatAsMoney = (amount, buyerCountry) => {
        const { code = 'US', currency = 'USD' } = countries.find(
                (item) => item.country === buyerCountry
        );
        return amount.toLocaleString(code, {
                style: 'currency',
                currency,
        });
};

const flagIfInvalid = (field, isValid) => {
        if (isValid) {
                field.classList.remove('is-invalid');
        } else {
                field.classList.add('is-invalid');
        }
};

const expiryDateFormatIsValid = (field) => {
        let regex = /^(0?[1-9]|1[0-2])\/\d{2}$/;
        return regex.test(field.value);
};

const detectCardType = (first4Digits) => {
        const div = document.querySelector('div[data-credit-card]');
        const img = document.querySelector('img[data-card-type]');
        if (first4Digits[0] === '4') {
                div.classList.add('is-visa');
                div.classList.remove('is-mastercard');
                img.src = supportedCards.visa;
                return 'is-visa';
        } else if (first4Digits[0] === '5') {
                div.classList.add('is-mastercard');
                div.classList.remove('is-visa');
                img.src = supportedCards.mastercard;
                return 'is-mastercard';
        }
};

const isFutureDate = (date) => {
        const currentDate = new Date();
        const expiryDate = new Date();

        const expiryMonth = parseInt(date.value.split('/')[0], 10);
        const expiryYear = parseInt(date.value.split('/')[1], 10);

        expiryDate.setMonth(`${expiryMonth}`);
        expiryDate.setYear(`${expiryYear}`);

        return expiryDate > currentDate;
};

const validateCardExpiryDate = () => {
        const expiryDate = document.querySelector('[data-cc-info] input:nth-child(2)');
        const isValid = expiryDateFormatIsValid(expiryDate.value) && isFutureDate(expiryDate.value);
        flagIfInvalid(expiryDate, isValid);
        return isValid;
};

const validateCardHolderName = () => {
        const fullName = document.querySelector('[data-cc-info] > input');
        const isValid = /^[a-zA-Z]{3,}[\s][a-zA-Z]{3,}$/.test(fullName.value);
        flagIfInvalid(fullName, isValid);
        return isValid;
};

const validateWithLuhn = (digits) => {
        if (digits.length !== 16) {
                return false;
        }
        let iCheck = 0;
        let iEven = false;
        for (let i = digits.length - 1; i >= 0; i--) {
                let digit = digits[i];
                nDigits = parseInt(digit, 10);
                if (iEven && (nDigits *= 2) > 9) {
                        nDigits -= 9;
                }
                iCheck += nDigits;
                iEven = !iEven;
        }
        return iCheck % 10 == 0;
};

const validateCardNumber = () => {
        const cardNumbers = appState.cardDigits.flat();
        let inputs = '',
                index = 0;
        while (index < 4) {
                inputs += cardNumbers[index++].value;
        }
        const digits = inputs.split(' ');
        const isValid = validateWithLuhn(digits);
        const target = document.querySelector('div[data-cc-digits]');
        if (isValid) {
                target.classList.remove('is-invalid');
        } else {
                target.classList.add('is-invalid');
        }
};

const validatePayment = () => {
        validateCardNumber();
        validateCardHolderName();
        validateCardExpiryDate();
};

const smartInput = (event, fieldIndex, fields) => {
        const userInput = parseInt(event.key);
        if (isNaN(userInput)) {
                return false;
        }

        const thisField = fields[fieldIndex];
        if (thisField.value.length < thisField.getAttribute('size')) {
                appState.cardDigits[fieldIndex][thisField.value.length] = userInput;

                thisField.value = thisField.value + userInput;
                if (fieldIndex == 0) {
                        const digit = appState.cardDigits[0];
                        detectCardType(digit);
                }
        }
        if (fieldIndex < 3) {
                setTimeout(() => {
                        let textmask = '';
                        let first4Digits = '';
                        for (let i = 0; i < thisField.value.length; i++) {
                                textmask += '#';
                        }
                        thisField.value = textmask;
                }, 500);
        }
};

const smartCursor = (event, fieldIndex, fields) => {
        if (event.target.value.length === event.target.size) {
                fields[fieldIndex + 1].focus();
        }
};

const enableSmartTyping = () => {
        const inputs = document.querySelectorAll('[data-cc-digits] input');
        inputs.forEach((field, index, fields) => {
                field.addEventListener('keyup', (event) => smartCursor(event, index, fields));
                field.addEventListener('keydown', (event) => smartInput(event, index, fields));
        });
};

const uiCanInteract = () => {
        const firstInput = document.querySelector('[data-cc-digits]').firstElementChild.focus();
        document.querySelector('[data-pay-btn]').addEventListener('click', validatePayment);
        billHype();
        enableSmartTyping();
};

const displayCartTotal = ({ results }) => {
        const [data] = results;
        const { itemsInCart, buyerCountry } = data;
        appState.items = itemsInCart;
        appState.country = buyerCountry;

        appState.bill = itemsInCart.reduce(
                (curr, nxt) => curr.price * curr.qty + nxt.price * nxt.qty
        );
        appState.billFormatted = formatAsMoney(appState.bill, appState.country);
        document.querySelector('[data-bill]').textContent = appState.billFormatted;

        appState.cardDigits = [];
        appState.cardDigits[0] = [];
        appState.cardDigits[1] = [];
        appState.cardDigits[2] = [];
        appState.cardDigits[3] = [];
        uiCanInteract();
};

const fetchBill = () => {
        const api = 'https://randomapi.com/api';
        const apiKey = '006b08a801d82d0c9824dcfdfdfa3b3c';
        const apiEndpoint = `${api}/${apiKey}`;
        fetch(apiEndpoint)
                .then((response) => response.json())
                .then((data) => displayCartTotal(data))
                .catch((error) => console.log(error));
};

const startApp = () => {
        fetchBill();
};

startApp();
