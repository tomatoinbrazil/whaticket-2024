import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import {
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    DialogActions,
    CircularProgress,
    TextField,
    InputLabel,
    Select,
    Switch,
    MenuItem,
    FormControlLabel,
    FormControl,
    Grid,
    Chip,
    Typography,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import ListClientTable from "./listClienSGA.js";
//import { AuthContext } from "../../context/Auth/AuthContext";

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

//const { user } = useContext(AuthContext);
//const { companyId } = user;

const SGAIntegrationModal = ({ open, onClose, integrationId }) => {
    const classes = useStyles();
    const initialState = {
        hora: "",
        token: "",
        envioAnt: "",
        envioAposVenc: "",
        msgAntVenc: "",
        msgVenc: "",
        msgAposVenc: "",
        name: "sga",
        whatsappId: "",

    };
    const [SGA, setSGA] = useState(initialState);
    const [id, setId] = useState('')
    const [ListClientModalOpen, setListClientModalOpen] = useState(false);
    const [resp, setResp] = useState({})
    const [whatsapps, setWhatsapps] = useState([]);
    const [companyId, setcompanyId] = useState([]);


    useEffect(() => {
        const fetchIntegration = async () => {
            try {
                const { data } = await api.get(`/integration`, { params: { name: "sga" } });
                const { hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId, companyId } = data[0]
                integrationId = data[0]['id'];
                setId(data[0]['id'])
                setcompanyId(companyId)
                setSGA({ hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId });
            } catch (err) {
                //toastError(err);
            }
        };
        fetchIntegration();
    }, [integrationId]);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data } = await api.get(`/whatsapp`, { params: { companyId, session: 0 } });
                setWhatsapps(data);
            } catch (err) {
                toastError(err);
            }
        };
        fetchSession();
    }, []);

    const handleListClient = () => {
        setListClientModalOpen(true);


    };

    const handleCloseListClient = () => {
        setListClientModalOpen(false);

    };


    const handleSaveIntegraTion = async (values) => {

        const integrationData = values;
        try {
            if (id) {
                await api.put(`/integration/${id}`, integrationData);
                const { hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId } = integrationData
                integrationId = integrationData['id'];
                setSGA(integrationData)
                //setSGA(integrationData)
                const fetchIntegration = async () => {
                    try {
                        const { data } = await api.get(`/integration`, { params: { name: "sga" } });
                        const { hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId } = data[0]
                        integrationId = data[0]['id'];
                        setId(data[0]['id'])
                        setSGA({ hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId });
                    } catch (err) {
                        toastError(err);
                    }
                };
                fetchIntegration();

            } else {
                await api.post("/integration", integrationData);
                setSGA(integrationData)
                integrationId = integrationData['id'];
                const fetchIntegration = async () => {
                    try {
                        const { data } = await api.get(`/integration`, { params: { name: "sga" } });
                        const { hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId } = data[0]
                        integrationId = data[0]['id'];
                        setId(data[0]['id'])
                        setSGA({ hora, token, envioAnt, envioAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId });
                    } catch (err) {
                        toastError(err);
                    }
                };
                fetchIntegration();
            }
            toast.success(i18n.t("integrationModal.success"));
            handleClose();
        } catch (err) {
            toastError(err);
        }
    };

    const handleClose = () => {
        onClose();
        setSGA(SGA);
    };

    const handleRemove = async () => {
        await api.delete(`/integration/${id}`);
        setId(null)
        setSGA(initialState);
        onClose();
        toast.success("Integração removida com sucesso.");
    };


    return (
        <div className={classes.root}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                scroll="paper"
            >
                <DialogTitle>Integração SGA</DialogTitle>
                <Formik
                    initialValues={SGA}
                    enableReinitialize={true}
                    validationSchema={SessionSchema}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            handleSaveIntegraTion(values);
                            actions.setSubmitting(false);
                        }, 400);
                    }}
                >
                    {({ values, touched, errors, isSubmitting }) => (
                        <Form>
                            <DialogContent dividers>
                                <div className={classes.multFieldLine}>
                                    <Grid spacing={2} container>
                                        <Grid item>

                                        </Grid>
                                    </Grid>
                                </div>
                                <div className={classes.multFieldLine}>
                                    <FormControl
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        className={classes.formControl}
                                    >
                                        <InputLabel id="whatsapp-selection-label">
                                            {i18n.t("campaigns.dialog.form.whatsapp")}
                                        </InputLabel>
                                        <Field
                                            as={Select}
                                            label={i18n.t("campaigns.dialog.form.whatsapp")}
                                            labelId="whatsapp-selection-label"
                                            id="whatsappId"
                                            name="whatsappId"
                                            error={touched.whatsappId && Boolean(errors.whatsappId)}
                                        >
                                            <MenuItem value="">Nenhuma</MenuItem>
                                            {whatsapps &&
                                                whatsapps.map((whatsapp) => (
                                                    <MenuItem key={whatsapp.id} value={whatsapp.id}>
                                                        {whatsapp.name}
                                                    </MenuItem>
                                                ))}
                                        </Field>
                                    </FormControl>
                                </div>
                                <div className={classes.multFieldLine}>
                                    <Field
                                        as={TextField}
                                        label={i18n.t("scheduleModal.form.sendAt")}
                                        type="time"
                                        name="hora"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        error={touched.sendAt && Boolean(errors.sendAt)}
                                        helperText={touched.sendAt && errors.sendAt}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <Field
                                        as={TextField}
                                        label={i18n.t("integrationModal.form.token")}
                                        autoFocus
                                        rows={2}
                                        name="token"
                                        error={touched.token && Boolean(errors.token)}
                                        helperText={touched.token && errors.token}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        className={classes.textField}
                                    />
                                </div>
                                <div>
                                    <Field
                                        as={TextField}
                                        label="Quantos dias antes do vencimento enviar a mensagem ?"
                                        type="envioAnt"
                                        fullWidth
                                        name="envioAnt"
                                        error={touched.envioAnt && Boolean(errors.envioAnt)}
                                        helperText={touched.envioAnt && errors.envioAnt}
                                        variant="outlined"
                                        margin="dense"
                                        inputProps={{ step: 1, min: 0, max: 29, type: 'number' }}
                                    />
                                </div>
                                <div>
                                    <Field
                                        as={TextField}
                                        label="Após o vencimento enviar a mensagem a cada quantos dias ?"
                                        type="envioAposVenc"
                                        fullWidth
                                        name="envioAposVenc"
                                        error={touched.envioAposVenc && Boolean(errors.envioAposVenc)}
                                        helperText={touched.envioAposVenc && errors.envioAposVenc}
                                        variant="outlined"
                                        margin="dense"
                                        inputProps={{ step: 1, min: 0, max: 29, type: 'number', }}
                                    />
                                </div>
                                <Typography style={{ marginBottom: 8, marginTop: 12 }} variant="subtitle1">
                                    Variáveis para serem utilizadas nas mensagens:
                                </Typography>
                                <div className={classes.root}>
                                    <Chip variant="outlined" color="secondary" clickable label="*%name%*" onClick={() => navigator.clipboard.writeText('*%name%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%invoiceNumber%*" onClick={() => navigator.clipboard.writeText('*%invoiceNumber%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%venc%*" onClick={() => navigator.clipboard.writeText('*%venc%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%valor%*" onClick={() => navigator.clipboard.writeText('*%valor%*')} />
                                    <Chip variant="outlined" color="secondary" label="%link%" onClick={() => navigator.clipboard.writeText('%link%')} />
                                </div>
                                <div>								<Typography style={{ marginBottom: 8, marginTop: 12 }} variant="subtitle1">
                                </Typography></div>
                                <div>
                                    <Field
                                        as={TextField}

                                        label="Mensagem antes do vencimento"
                                        type="msgAntVenc"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        name="msgAntVenc"
                                        error={
                                            touched.msgAntVenc && Boolean(errors.msgAntVenc)
                                        }
                                        helperText={
                                            touched.msgAntVenc && errors.msgAntVenc
                                        }
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </div>
                                <div>
                                    <Field
                                        as={TextField}
                                        label="Mensagem no vencimento"
                                        type="msgVenc"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        name="msgVenc"
                                        error={touched.msgVenc && Boolean(errors.msgVenc)}
                                        helperText={touched.msgVenc && errors.msgVenc}
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </div>
                                <div>
                                    <Field
                                        as={TextField}
                                        label="Mensagem após vencimento"
                                        type="msgAposVenc"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        name="msgAposVenc"
                                        error={
                                            touched.msgAposVenc &&
                                            Boolean(errors.msgAposVenc)
                                        }
                                        helperText={
                                            touched.msgAposVenc && errors.msgAposVenc
                                        }
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </div>

                            </DialogContent>
                            <DialogActions>
                                {/* {id ?
                                    <Button
                                        onClick={handleListClient}
                                        color="secondary"
                                        disabled={isSubmitting}
                                        variant="outlined"
                                    >
                                        Listar Clientes
                                    </Button>
                                    : null}
                                {id ?
                                    <Button
                                        onClick={handleRemove}
                                        color="primary"
                                        disabled={isSubmitting}
                                        variant="outlined"
                                    >
                                        Remover
                                        {isSubmitting && (
                                            <CircularProgress size={24} className={classes.buttonProgress} />
                                        )}
                                    </Button>
                                    : null
                                } */}
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
                                    disabled={isSubmitting}
                                    variant="contained"
                                    className={classes.btnWrapper}
                                >
                                    {integrationId
                                        ? i18n.t("integrationModal.buttons.okEdit")
                                        : i18n.t("integrationModal.buttons.okEdit")}
                                    {isSubmitting && (
                                        <CircularProgress
                                            size={24}
                                            className={classes.buttonProgress}
                                        />
                                    )}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </div>
    );
};

export default React.memo(SGAIntegrationModal);
