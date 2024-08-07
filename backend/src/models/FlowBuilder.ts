import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  HasMany,
  BelongsToMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Ticket from "./Ticket";
import Queue from "./Queue";
import UserQueue from "./UserQueue";
import Company from "./Company";

interface InterfaceEdges {
  source: string;
  target: string;
}

interface InterfacePosition {
  x: number;
  y: number;
}

interface InterfaceOptions {
  id: string;
  number: string;
  text: string;
}

interface InterfaceSubData {
  text?: string;
  id?: string;
  title?: string;
  options?: InterfaceOptions[];
}

interface InterfaceData {
  type: string;
  data: InterfaceSubData;
}

interface InterfaceNodes {
  conditionalId?: string;
  id: string;
  nodeId?: string;
  optionId?: string;
  position: InterfacePosition;
  data: InterfaceData[];
}

interface TypeData {
  title: string,
  edges: InterfaceEdges[];
  nodes: InterfaceNodes[];
  companyId: number;
}

@Table
class FlowBuilder extends Model<FlowBuilder> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.STRING)
  title: string;

  @Column(DataType.JSON)
  edges: InterfaceEdges[];

  @Column(DataType.JSON)
  nodes: InterfaceNodes[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

}

export default FlowBuilder;
