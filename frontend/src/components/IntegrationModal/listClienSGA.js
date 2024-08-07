import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { format } from 'date-fns';
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    DialogActions,
    CircularProgress,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
} from "@material-ui/core";

import {
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
} from "@material-ui/core";

import {
    Edit as EditIcon,
    DeleteOutline as DeleteOutlineIcon,
    People as PeopleIcon,
} from "@material-ui/icons";
import moment from 'moment'
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import ListClientTable from "./listClient.js";
import SearchIcon from "@material-ui/icons/Search";

var axios = require("axios").default;
const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },

    multFieldLine: {
        display: "flex",
        "& > *:not(:last-child)": {
            marginRight: theme.spacing(1),
        },
    },

    btnWrapper: {
        position: "relative",
    },

    btnClient: {
        position: "relative",
    },

    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
}));

const SessionSchema = Yup.object().shape({
    token: Yup.string()
        .min(2, "Too Short!")
        .max(512, "Too Long!")
        .required("Required"),
});

const ListClienteIntegrationModal = ({ open, onClose, integrationId, response }) => {
    const classes = useStyles();
    const [resp, setResp] = useState({})
    const [loading, setLoading] = useState(true);
    const [msgAposVenc, setMsgAposVenc] = useState('');
    const [tokenWhatsApp, settokenWhatsApp] = useState('');
    const [whatsappId, setWhatsappId] = useState('');
    const [ListClientModalOpen, setListClientModalOpen] = useState(false);
    const [peopleInfo, setPeopleInfo] = useState([]);
    const [searchParam, setSearchParam] = useState("");
    const companyId = localStorage.getItem("companyId");
    const initialValues = {
        firstname: "",
        lastname: ""
    }

    const delay = ms => new Promise(
        resolve => setTimeout(resolve, ms)
    );

    useEffect(() => {
        const fetchIntegration = async () => {
            try {
                const data = await api.get(`/integration/sga`).then(res => {
                    setResp(res.data);
                });
                await delay(25000);
                setLoading(false)
            } catch (err) {
                //console.log(err);
            }
        };
        fetchIntegration()

    }, []);

    useEffect(() => {
        const fetchIntegration = async () => {
            try {
                const data = await api.get(`/integration`).then(res => {
                    setMsgAposVenc(res.data[0].msgAposVenc);
                    setWhatsappId(res.data[0].whatsappId);
                    //console.log("🚀 Console Log : res:", res.data[0].whatsappId);
                });

            } catch (err) {
                //console.log(err);
            }
        };
        fetchIntegration();
    }, []);
    
/*     useEffect(() => {
        const fetchIntegrationWhats = async () => {
            console.log("🚀 Console Log : whatsappId:", whatsappId);
            try {
                const whatsapp = await api.get(`/whatsapp/${whatsappId}`).then(res => {
                    settokenWhatsApp(res.data.token);
                    console.log("🚀 Console Log : res:", res.data.token);
                    console.log("🚀 Console Log : tokenWhatsApp:", tokenWhatsApp);
                });

            } catch (err) {
                //console.log(err);
            }
        };
        fetchIntegrationWhats()

    }, []); */

    const handleChange = (item) => (dados) => {
        if (dados.target.checked) {
            peopleInfo.push(item);

        } else {
            const index = peopleInfo.findIndex(items => items.id === item.id);
            peopleInfo.splice(index, 1)
        }
    };

    const handleSearch = (event) => {
        setLoading(true)
        setSearchParam(event.target.value.toLowerCase());
        const filtered = resp.find(x => x.name.toLocaleLowerCase().includes(event.target.value));
        //setResp(filtered)
        //console.log(event.target.checked);
        //setLoading(false)
        //console.log("🚀 Console Log : filtered:", filtered);
    };

    const selectAll = (item) => (dados) => {

        if (dados.target.checked) {
            item.map((dados) => {
                peopleInfo.push(dados);
            })
            //setPeopleInfo(item);
        } else {
            setPeopleInfo([])
        }
    };


    const handleClose = () => {
        onClose();
    };

    function currencyFormat(value) {
        const formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return formattedValue;
    }

    const renderRows = (data1) => {
        return resp.map((dados, index) => {
            return (
                <TableRow key={index}>
                    <TableCell align="left"><input
                        type="checkbox"
                        name="languages"
                        id="flexCheckDefault"
                        onChange={handleChange(dados)}

                    /></TableCell>
                    <TableCell align="left">{dados.name}</TableCell>
                    <TableCell align="center">{moment(dados.dueDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell align="center">{currencyFormat(dados.netValue)}</TableCell>
                </TableRow>
            );
        });
    };

    const fetchIntegrationWhats = async () => {
        try {
            const whatsapp = await api.get(`/whatsapp/${whatsappId}`).then(res => {
                settokenWhatsApp(res.data.token);
                peopleInfo.map((dados, index) => {
                    var mobilePhone = dados.mobilePhone;
                    var name = dados.name;
                    var invoiceNumber = dados.invoiceNumber;
                    var invoiceUrl = dados.invoiceUrl;
                    var dueDate = moment(dados.dueDate).format("DD/MM/YYYY");
                    var netValue = currencyFormat(dados.netValue)
        
                    var msg = msgAposVenc.replaceAll("%name%", name)
                    var msg = msg.replaceAll("%venc%", dueDate)
                    var msg = msg.replaceAll("%valor%", netValue)
                    var msg = msg.replaceAll("%invoiceNumber%", invoiceNumber)
                    var msg = msg.replaceAll("%link%", invoiceUrl)
        
                    var options = {
                        method: 'POST',
                        url: `${process.env.REACT_APP_BACKEND_URL}/api/messages/send`,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${res.data.token}`
                        },
                        data: { number: `55${mobilePhone}`, body: msg }    /* ALTEREAR NUMERO PARA VARIAVEL"mobilePhone" */
                    };
        
                    axios.request(options).then(function (response) {
                        toast.success('Mensagem enviada com sucesso');
                        handleClose();
                    }).catch(function (error) {
                        toastError(error);
                    });
                });
            });

        } catch (err) {
            //console.log(err);
        }
    };
    const handleSendTextMessage = async (values) => {
        fetchIntegrationWhats()



    }


    return (
        <div className={classes.root}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                scroll="paper"
            >
                <ListClientTable
                    open={ListClientModalOpen}
                    onClose={handleClose}
                />
                <DialogTitle>Integração SGA</DialogTitle>
                <Formik
                    initialValues={initialValues}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            handleSendTextMessage(values);
                            actions.setSubmitting(false);
                        }, 400);
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <DialogContent dividers>
                                <div className={classes.multFieldLine}>
                                    <Grid spacing={2} container>
                                        <Grid item>

                                        </Grid>
                                        <Grid xs={7} sm={6} item>
                                            {/* <TextField
                                                fullWidth
                                                placeholder={i18n.t("contacts.searchPlaceholder")}
                                                type="search"
                                                value={searchParam}
                                                onChange={handleSearch}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon style={{ color: "gray" }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            /> */}
                                        </Grid>
                                    </Grid>
                                </div>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="left">
                                            </TableCell>
                                            <TableCell align="left">Nome</TableCell>
                                            <TableCell align="center">Data Venc.</TableCell>
                                            <TableCell align="center">Valor</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRowSkeleton columns={4} />
                                        ) : (
                                            renderRows(resp)
                                        )}
                                    </TableBody>
                                </Table>
                            </DialogContent>
                            <DialogActions>
                                <input
                                    type="checkbox"
                                    name="languages"
                                    id="flexCheckDefault"
                                    onChange={selectAll(resp)}

                                />ENVIAR PARA TODOS
                                <Button
                                    onClick={handleClose}
                                    color="secondary"
                                    disabled={isSubmitting}
                                    variant="outlined"
                                >
                                    {i18n.t("integrationModal.buttons.cancel")}
                                </Button>


                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="contained"
                                    className={classes.btnWrapper}
                                >
                                    {isSubmitting ? (<CircularProgress size={24} className={classes.buttonProgress} />) : 'Enviar'}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </div>
    );
};

export default React.memo(ListClienteIntegrationModal);
