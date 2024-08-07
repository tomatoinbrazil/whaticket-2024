import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import Grid from '@material-ui/core/Grid';
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
    Chip,
    Typography,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
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

const EvoIntegrationModal = ({ open, onClose, integrationId }) => {
    const classes = useStyles();
    const initialState = {
        hora: "",
        token: "",
        nameToken: "",
        envioAnt: "",
        envioAposVenc: "",
        maxAposVenc: "",
        incAposVenc: "",
        msgAntVenc: "",
        msgVenc: "",
        msgAposVenc: "",
        envDiaVenc: "",
        name: "evo",
        whatsappId: "",

    };
    const [evo, setEvo] = useState(initialState);
    const [id, setId] = useState('')
    const [ListClientModalOpen, setListClientModalOpen] = useState(false);
    const [resp, setResp] = useState({})
    const [whatsapps, setWhatsapps] = useState([]);
    const [companyId, setcompanyId] = useState([]);

    /*     useEffect(() => {
            const fetchSession = async () => {
                try {
                    const { data } = await api.get(`/integration/evo`);
                    setResp(data);
                } catch (err) {
                    //toastError(err);
                }
            };
            fetchSession();
        }, []); */

    useEffect(() => {
        const fetchIntegration = async () => {
            try {
                const { data } = await api.get(`/integration`, { params: { name: "evo" } });
                const { hora, token, envioAnt, nameToken, envioAposVenc, maxAposVenc, incAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId, companyId, envDiaVenc } = data[0]
                integrationId = data[0]['id'];
                setId(data[0]['id'])
                setcompanyId(companyId)
                setEvo({ hora, token, envioAnt, envioAposVenc, nameToken, maxAposVenc, incAposVenc, msgAntVenc, msgVenc, msgAposVenc, envDiaVenc, whatsappId });
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


    const handleSaveIntegraTion = async (values) => {

        const integrationData = values;
        try {
            if (id) {
                await api.put(`/integration/${id}`, integrationData);
                const { hora, token, envioAnt, envioAposVenc, nameToken, maxAposVenc, incAposVenc, envDiaVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId } = integrationData
                integrationId = integrationData['id'];
                setEvo(integrationData)
                //setEvo(integrationData)
                const fetchIntegration = async () => {
                    try {
                        const { data } = await api.get(`/integration`, { params: { name: "evo" } });
                        const { hora, token, envioAnt, envioAposVenc, nameToken, envDiaVenc, maxAposVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId } = data[0]
                        integrationId = data[0]['id'];
                        setId(data[0]['id'])
                        setEvo({ hora, token, envioAnt, envioAposVenc, nameToken, maxAposVenc, incAposVenc, envDiaVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId });
                    } catch (err) {
                        toastError(err);
                    }
                };
                fetchIntegration();

            } else {
                await api.post("/integration", integrationData);
                setEvo(integrationData)
                integrationId = integrationData['id'];
                const fetchIntegration = async () => {
                    try {
                        const { data } = await api.get(`/integration`, { params: { name: "evo" } });
                        const { hora, token, envioAnt, nameToken, envioAposVenc, incAposVenc, maxAposVenc, envDiaVenc, msgAntVenc, msgVenc, msgAposVenc, whatsappId } = data[0]
                        integrationId = data[0]['id'];
                        setId(data[0]['id'])
                        setEvo({ hora, token, envioAnt, nameToken, envioAposVenc, incAposVenc, maxAposVenc, msgAntVenc, envDiaVenc, msgVenc, msgAposVenc, whatsappId });
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
        setEvo(evo);
    };

    const handleRemove = async () => {
        await api.delete(`/integration/${id}`);
        setId(null)
        setEvo(initialState);
        onClose();
        toast.success("Integração removida com sucesso.");
    };


    return (
        <div className={classes.root}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                scroll="paper"
            >
                <DialogTitle>
                    {integrationId
                        ? i18n.t("integrationModal.title.edit")
                        : i18n.t("integrationModal.title.add")}
                </DialogTitle>
                <Formik
                    initialValues={evo}
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
                                <Grid container spacing={1} justifyContent="flex-start">
                                    <Grid item xs={6} sm={6} md={6}>
                                        <div>
                                            <Field
                                                as={TextField}
                                                label={i18n.t("Usuário")}
                                                rows={2}
                                                name="nameToken"
                                                error={touched.nameToken && Boolean(errors.nameToken)}
                                                helperText={touched.nameToken && errors.nameToken}
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                                className={classes.textField}
                                            />
                                        </div>
                                    </Grid>
                                    <Grid item xs={6} sm={6} md={6}>
                                        <div>
                                            <Field
                                                as={TextField}
                                                label={i18n.t("integrationModal.form.token")}
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
                                    </Grid>
                                </Grid>
                                <Grid container spacing={1} justifyContent="flex-start">
                                    <Grid item xs={6} sm={6} md={6}>
                                        <FormControl
                                            variant="outlined"
                                            margin="dense"
                                            fullWidth
                                            className={classes.formControl}
                                        >
                                            <InputLabel id="envDiaVenc-selection-label">
                                                {i18n.t("Enviar no dia do vencimento ?")}
                                            </InputLabel>
                                            <Field
                                                as={Select}
                                                label="Enviar no dia do vencimento ?"
                                                labelId="whatsapp-selection-label"
                                                id="envDiaVenc"
                                                name="envDiaVenc"
                                                error={touched.envDiaVenc && Boolean(errors.envDiaVenc)}
                                            >
                                                <MenuItem value="true">Sim</MenuItem>
                                                <MenuItem value="false">Não</MenuItem>
                                            </Field>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6} sm={6} md={6}>
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
                                    </Grid>
                                </Grid>
                                <Grid container spacing={1} justifyContent="flex-start">
                                    <Grid item xs={3} sm={3} md={4}>
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
                                            inputProps={{ step: 1, min: 0, max: 500, type: 'number', }}
                                        />
                                    </Grid>
                                    <Grid item xs={3} sm={3} md={4}>
                                        <Field
                                            as={TextField}
                                            label="Iniciar o envio após quantos dias ?"
                                            type="incAposVenc"
                                            fullWidth
                                            name="incAposVenc"
                                            error={touched.incAposVenc && Boolean(errors.incAposVenc)}
                                            helperText={touched.incAposVenc && errors.incAposVenc}
                                            variant="outlined"
                                            margin="dense"
                                            inputProps={{ step: 1, min: 0, max: 500, type: 'number', }}
                                        />
                                    </Grid>
                                    <Grid item xs={3} sm={3} md={4}>
                                        <Field
                                            as={TextField}
                                            label="Maximo de dias para enviar mensagem após vencimento ?"
                                            type="maxAposVenc"
                                            fullWidth
                                            name="maxAposVenc"
                                            error={touched.maxAposVenc && Boolean(errors.maxAposVenc)}
                                            helperText={touched.maxAposVenc && errors.maxAposVenc}
                                            variant="outlined"
                                            margin="dense"
                                            inputProps={{ step: 1, min: 0, max: 500, type: 'number', }}
                                        />
                                    </Grid>
                                </Grid>
                                <Typography style={{ marginBottom: 8, marginTop: 12 }} variant="subtitle1">
                                    Variáveis para serem utilizadas nas mensagens:
                                </Typography>
                                <div className={classes.root}>
                                    <Chip variant="outlined" color="secondary" clickable label="*%name%*" onClick={() => navigator.clipboard.writeText('*%name%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%branchName%*" onClick={() => navigator.clipboard.writeText('*%branchName%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%venc%*" onClick={() => navigator.clipboard.writeText('*%venc%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%valor%*" onClick={() => navigator.clipboard.writeText('*%valor%*')} />
                                    <Chip variant="outlined" color="secondary" label="*%motivo%*" onClick={() => navigator.clipboard.writeText('*%motivo%*')} />
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
                                }
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

export default React.memo(EvoIntegrationModal);
