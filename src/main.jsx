import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ProductsProvider } from "./context/ProductsContext";
import { PageContentProvider } from "./context/PageContentContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CategoriesProvider>
        <ProductsProvider>
          <PageContentProvider>
            <SiteSettingsProvider>
              <App />
            </SiteSettingsProvider>
          </PageContentProvider>
        </ProductsProvider>
      </CategoriesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
