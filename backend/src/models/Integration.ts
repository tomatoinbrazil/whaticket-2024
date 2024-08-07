import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    Default,
    AllowNull,
    Unique,
    ForeignKey,
    BelongsTo
} from "sequelize-typescript";
import Company from "./Company";

@Table
class Integration extends Model<Integration> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Default("")
    @Column(DataType.TEXT)
    hora: string;

    @Default("")
    @Column(DataType.TEXT)
    token: string;

    @Default("")
    @Column(DataType.TEXT)
    nameToken: string;

    @Default("")
    @Column(DataType.INTEGER)
    envioAnt: number;

    @Default("")
    @Column(DataType.INTEGER)
    envioAposVenc: number;

    @Default("")
    @Column(DataType.INTEGER)
    maxAposVenc: number;

    @Default("")
    @Column(DataType.INTEGER)
    incAposVenc: number;

    @Default("")
    @Column(DataType.INTEGER)
    whatsappId: number;

    @Default("")
    @Column
    msgAntVenc: string;

    @Column
    envDiaVenc: boolean;

    @Default("")
    @Column
    msgAposVenc: string;

    @Default("")
    @Column
    msg3AposVenc: string;

    @Default("")
    @Column
    msgVenc: string;

    @Default("")
    @Column
    name: string;

    @ForeignKey(() => Company)
    @Column
    companyId: number;

    @BelongsTo(() => Company)
    company: Company;

}

export default Integration;
