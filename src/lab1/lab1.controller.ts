import * as express from 'express';
import { Lab1Service } from "./lab1.service";

class Lab1Controller {
  private path = '/lab1';
  private router = express.Router();
  private service = new Lab1Service();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(this.path + '/connect', this.service.connectWebSocket);
    this.router.post(this.path + '/nextLayer', this.service.nextLayer);
    this.router.get(this.path + '/pause', this.service.pause);
  }
}

export default Lab1Controller;