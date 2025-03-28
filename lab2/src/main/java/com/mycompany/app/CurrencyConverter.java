package com.mycompany.app;

import org.json.JSONArray;
import org.json.JSONObject;

import jakarta.jws.WebMethod;
import jakarta.jws.WebService;
import jakarta.xml.ws.Endpoint;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

@WebService
public class CurrencyConverter {
    private static final String NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
    private static final Map<String, Double> exchangeRates = new HashMap<>();

    @WebMethod
    public double convertCurrency(double amount, String from, String to) {
        updateExchangeRates();
        if (!exchangeRates.containsKey(from) || !exchangeRates.containsKey(to)) {
            throw new IllegalArgumentException("Unsupported currency");
        }
        double rateFromUAH = exchangeRates.get(from);
        double rateToUAH = exchangeRates.get(to);
        return amount * (rateToUAH / rateFromUAH);
    }

    private static void updateExchangeRates() {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(NBU_URL).openConnection();
            connection.setRequestMethod("GET");
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            JSONArray rates = new JSONArray(response.toString());
            exchangeRates.clear();
            exchangeRates.put("UAH", 1.0);
            for (int i = 0; i < rates.length(); i++) {
                JSONObject rate = rates.getJSONObject(i);
                String cc = rate.getString("cc");
                double rateToUAH = rate.getDouble("rate");
                exchangeRates.put(cc, rateToUAH);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        String url = "http://localhost:8080/CurrencyConverter";
        Endpoint.publish(url, new CurrencyConverter());
        System.out.println("SOAP service is running at " + url + "?wsdl");
    }
}
