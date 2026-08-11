import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import { StockProvider } from "./context/StockContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StockProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </StockProvider>
    </BrowserRouter>
  </React.StrictMode>
);
