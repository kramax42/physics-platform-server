export type DataDimension = "1D" | "2D";
export type EventType = "start" | "pause" | "continue" | "close";
export type DataToReturn = "Ez" | "Hy" | "Hx" | "Energy";


export type Material = {
  // name: string;
  // color: string;
  id: number;
  eps: number;    // Electric permittivity.
  mu: number;     // Permeability.
  sigma: number;  // Conductivity.
};

type SourcePosition = {
  x: number;
  y: number;
}

export type MessageFromClient = {
  event: EventType;
  type: DataDimension;
  // dataToReturn: DataToReturnType;
  dataToReturn: number;
  condition: [number, number];
  materialMatrix: number[][];
  materials: Material[];
  srcPositionRelative: SourcePosition[];
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

export type InitDataObject = {
  condition: [number, number];
  dataToReturn: number;
  materialMatrix: number[];
  eps: number[];
  mu: number[];
  sigma: number[];
  rows: number;
  srcPositionRelativeSet: number[];
};

