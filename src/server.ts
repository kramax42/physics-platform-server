import App from './app';
import Lab1Controller from "./lab1/lab1.controller";

const PORT = process.env.PORT || 5000;

const app = new App([
    new Lab1Controller(),
  ],
  PORT,
);

app.listen();


