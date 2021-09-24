import App from './app';
import Lab1Controller from "./lab1/lab1.controller";
import Lab2Controller from "./lab2/lab2.controller";

const PORT = process.env.PORT || 5000;

const app = new App([
    new Lab1Controller(),
    new Lab2Controller(),
  ],
  PORT,
);

app.listen();


