export type dataType = "2D" | "3D" | "INTERFERENCE" | "DIFRACTION";
export type eventType = "start" | "pause" | "continue" | "close";

export type dataToReturnType = "Ez" | "Hy" | "Hx" | "Energy";

export type startMessageType = {
  event: eventType;
  type: dataType;
  dataToReturn: dataToReturnType;
  condition: number[];
  matrix: number[][];

};

export type ReturnObjAddonType = {
  dataX: number[][];
  dataY: number[][];
  dataEz?: number[][];
  dataHy?: number[][];
  dataHx?: number[][];
  currentTick: number;
  row: number;
  col: number;
};

export type GetDataType = (
  condition: number[],
  reload: boolean,
  refractionMatrix: number[],
  refractionMatrixRows: number,
  returnDataNumber: number
) => ReturnObjAddonType;

export type InitDataObjectType = {
  condition: number[];
  returnDataNumber: number;
  currentDataType: dataType;
  refractionMatrix: number[];
  dataToReturn: dataToReturnType;
  returnDataStr: string;
  getData: GetDataType;
  refractionMatrixRows: number;
};
