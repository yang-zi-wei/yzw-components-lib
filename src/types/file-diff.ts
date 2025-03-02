export interface RowUnit {
  seq: number;
  content: string;
  add?: boolean;
  delete?: boolean;
}
export interface RenderUnit {
  fileInfo: string;
  leftRows: RowUnit[];
  rightRows: RowUnit[];
}

export interface RowUnitByLines {
  oldSeq?: number;
  newSeq?: number;
  content: string;
  add?: boolean;
  delete?: boolean;
  normal?: boolean;
}
export interface RenderUnitByLines {
  fileInfo: string;
  lines: RowUnitByLines[];
}
