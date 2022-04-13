export type dataType = "2D" | "3D" | "INTERFERENCE" | "DIFRACTION";
export type eventType = "start" | "pause" | "continue" | "close";

export type dataToReturnType = "Ez" | "Hy" | "Hx" | "Energy";

export type startMessageType = {
  event: eventType;
  type: dataType;
  dataToReturn: dataToReturnType;
  condition: number[];
  matrix: number[][];
  omegaMatrix: number[][]; 
  sourcePositionRelative: { x: number, y: number };
};

export type ReturnObjAddonType = {
  dataX: number[][];
  dataY: number[][];
  dataEz?: number[][];
  dataHy?: number[][];
  dataHx?: number[][];
  max: number;
  min: number;
  currentTick: number;
  row: number;
  col: number;
};

export type GetDataType = (
  condition: number[],
  reload: boolean,
  refractionMatrix: number[],
  refractionMatrixRows: number,
  returnDataNumber: number,
  omegaMatrix: number[],
) => ReturnObjAddonType;

export type InitDataObjectType = {
  condition: number[];
  returnDataNumber: number;
  currentDataType: dataType;
  refractionMatrix: number[];
  omegaMatrix: number[];
  dataToReturn: dataToReturnType;
  returnDataStr: string;
  refractionMatrixRows: number;
  sourcePositionRelative: {x: number, y: number};
};
