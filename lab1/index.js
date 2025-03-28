const http = require('http');
const { parseString } = require('xml2js');
const { Builder } = require('xml2js');
const https = require('https');

let exchangeRates = {};

function updateExchangeRates() {
    https.get('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const rates = JSON.parse(data);
                exchangeRates = {
                    UAH: { USD: rates.find(r => r.cc === 'USD').rate, EUR: rates.find(r => r.cc === 'EUR').rate },
                    USD: { UAH: 1 / rates.find(r => r.cc === 'USD').rate, EUR: rates.find(r => r.cc === 'USD').rate / rates.find(r => r.cc === 'EUR').rate },
                    EUR: { UAH: 1 / rates.find(r => r.cc === 'EUR').rate, USD: 1 / (rates.find(r => r.cc === 'USD').rate / rates.find(r => r.cc === 'EUR').rate) }
                };
                console.log('Exchange rates updated:', exchangeRates);
            } catch (error) {
                console.error('Failed to update exchange rates:', error);
            }
        });
    }).on('error', (err) => console.error('Error fetching exchange rates:', err));
}

updateExchangeRates();
setInterval(updateExchangeRates, 3600000);

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/convert') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            parseString(body, (err, result) => {
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/xml' });
                    res.end('<error>Invalid XML</error>');
                    return;
                }
                
                const { amount, from, to } = result.request;
                const amountValue = parseFloat(amount[0]);
                const fromCurrency = from[0];
                const toCurrency = to[0];
                
                if (!exchangeRates[fromCurrency] || !exchangeRates[fromCurrency][toCurrency]) {
                    res.writeHead(400, { 'Content-Type': 'application/xml' });
                    res.end('<error>Unsupported currency</error>');
                    return;
                }
                
                const rate = exchangeRates[fromCurrency][toCurrency];
                const convertedAmount = amountValue * rate;
                
                const builder = new Builder();
                const responseXml = builder.buildObject({ response: { amount: convertedAmount.toFixed(2), currency: toCurrency } });
                
                res.writeHead(200, { 'Content-Type': 'application/xml' });
                res.end(responseXml);
            });
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/xml' });
        res.end('<error>Not Found</error>');
    }
});

server.listen(3000, () => console.log('Server running on port 3000'));
