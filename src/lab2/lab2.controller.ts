import * as express from 'express';
import { Lab2Service } from "./lab2.service";

class Lab2Controller {
  private path = '/lab2';
  private router = express.Router();
  private service = new Lab2Service();

  constructor() {
    this.intializeRoutes();
  }

  private intializeRoutes() {
    this.router.get(this.path + '/connect', this.service.connectWebSocket);
    this.router.post(this.path + '/nextLayer', this.service.nextLayer);
    this.router.get(this.path + '/pause', this.service.pause);
  }
}

export default Lab2Controller;