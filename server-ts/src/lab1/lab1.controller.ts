import * as express from 'express';
import {Lab1Service} from "./Lab1.service";


class Lab1Controller {
  public path = '/lab1';
  public router = express.Router();
  service = new Lab1Service();

  constructor() {
    this.intializeRoutes();
  }

  public intializeRoutes() {
    this.router.get(this.path + '/connect', this.service.connectWebSocket);
    this.router.post(this.path + '/nextLayer', this.service.nextLayer);
    this.router.get(this.path + '/pause', this.service.pause);
  }

}

export default Lab1Controller;