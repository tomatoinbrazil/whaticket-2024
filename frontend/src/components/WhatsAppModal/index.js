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
  Switch,
  FormControlLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import usePlans from "../../hooks/usePlans/index.js";
import useCompanies from "../../hooks/useCompanies";

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
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  const initialState = {
    name: "",
    greetingMessage: "",
    complationMessage: "",
    outOfHoursMessage: "",
    ratingMessage: "",
    isDefault: false,
    enablePowerCrm: false,
    token: "",
    provider: "beta",
    timeSendQueue: 0,
    sendIdQueue: 0,
    expiresInactiveMessage: "",
    expiresTicket: 0,
    timeUseBotQueues: 0,
    maxUseBotQueues: 3
  };
  const [whatsApp, setWhatsApp] = useState(initialState);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [queues, setQueues] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [flows, setFlows] = useState([]);
  const [powerCRMEnabled, setPowerCRMEnabled] = useState(false);
  const [company, setCompany] = useState({});

  const { finder, getPlanCompany } = usePlans();
  const { find, updateSchedules } = useCompanies();


  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    (async () => {
      try {
        const company = await find(companyId);
        const powerCRM = await finder(company.planId)
        setPowerCRMEnabled(powerCRM.usePowerCrm)
        const { data } = await api.get("/prompt");
        const response = await api.get('/flowbuilder');
        if (Array.isArray(response.data?.flows) && response.data.flows.length > 0) {
          setFlows(response.data.flows)
        }
        setPrompts(data.prompts);
      } catch (err) {
        toastError(err);
      }
    })();
  }, [whatsAppId]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`whatsapp/${whatsAppId}?session=0`);
        setWhatsApp(data);
        data.promptId ? setSelectedPrompt(data.promptId) : setSelectedPrompt(null);
        data.flowId ? setSelectedFlow(data.flowId) : setSelectedFlow(null);

        const whatsQueueIds = data.queues?.map((queue) => queue.id);
        setSelectedQueueIds(whatsQueueIds);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
    })();
  }, []);

  const handleSaveWhatsApp = async (values) => {
    const whatsappData = {
      ...values, queueIds: selectedQueueIds,
      promptId: selectedPrompt ? selectedPrompt : null,
      flowId: selectedFlow ? selectedFlow : null,
    };
    delete whatsappData["queues"];
    delete whatsappData["session"];

    try {
      if (whatsAppId) {
        await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
      } else {
        await api.post("/whatsapp", whatsappData);
      }
      toast.success(i18n.t("whatsappModal.success"));
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleChangeQueue = (e) => {
    setSelectedQueueIds(e);
    setSelectedPrompt(null);
    setSelectedFlow(null);
  };

  const handleChangePrompt = (e) => {
    setSelectedPrompt(e.target.value);
    setSelectedQueueIds([]);
    setSelectedFlow(null);
  };

  const handleChangeFlow = (e) => {
    setSelectedFlow(e.target.value);
    setSelectedQueueIds([]);
    setSelectedPrompt(null);
  };

  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
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
          {whatsAppId
            ? i18n.t("whatsappModal.title.edit")
            : i18n.t("whatsappModal.title.add")}
        </DialogTitle>
        <Formik
          initialValues={whatsApp}
          enableReinitialize={true}
          validationSchema={SessionSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveWhatsApp(values);
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
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.name")}
                        autoFocus
                        name="name"
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        variant="outlined"
                        margin="dense"
                        className={classes.textField}
                      />
                    </Grid>
                    <Grid style={{ paddingTop: 15 }} item>
                      <FormControlLabel
                        control={
                          <Field
                            as={Switch}
                            color="primary"
                            name="isDefault"
                            checked={values.isDefault}
                          />
                        }
                        label={i18n.t("whatsappModal.form.default")}
                      />
                    </Grid>
                    {process.env.REACT_APP_ENABLE_POWER_CRM === "true" && powerCRMEnabled === true ? (
                      <Grid style={{ paddingTop: 15 }} item>
                        <FormControlLabel
                          control={
                            <Field
                              as={Switch}
                              color="primary"
                              name="enablePowerCrm"
                              checked={values.enablePowerCrm}
                            />
                          }
                          label={i18n.t("Ativar Power CRM	?")}
                        />
                      </Grid>
                    ) : null}
                  </Grid>
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.greetingMessage")}
                    type="greetingMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="greetingMessage"
                    error={
                      touched.greetingMessage && Boolean(errors.greetingMessage)
                    }
                    helperText={
                      touched.greetingMessage && errors.greetingMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.complationMessage")}
                    type="complationMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="complationMessage"
                    error={
                      touched.complationMessage &&
                      Boolean(errors.complationMessage)
                    }
                    helperText={
                      touched.complationMessage && errors.complationMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.outOfHoursMessage")}
                    type="outOfHoursMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="outOfHoursMessage"
                    error={
                      touched.outOfHoursMessage &&
                      Boolean(errors.outOfHoursMessage)
                    }
                    helperText={
                      touched.outOfHoursMessage && errors.outOfHoursMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.ratingMessage")}
                    type="ratingMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="ratingMessage"
                    error={
                      touched.ratingMessage && Boolean(errors.ratingMessage)
                    }
                    helperText={touched.ratingMessage && errors.ratingMessage}
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.token")}
                    type="token"
                    fullWidth
                    name="token"
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <QueueSelect
                  selectedQueueIds={selectedQueueIds}
                  onChange={(selectedIds) => handleChangeQueue(selectedIds)}
                />
                <FormControl
                  margin="dense"
                  variant="outlined"
                  fullWidth
                >
                  <InputLabel>
                    {i18n.t("whatsappModal.form.prompt")}
                  </InputLabel>
                  <Select
                    labelId="dialog-select-prompt-label"
                    id="dialog-select-prompt"
                    name="promptId"
                    value={selectedPrompt || ""}
                    onChange={handleChangePrompt}
                    label={i18n.t("whatsappModal.form.prompt")}
                    fullWidth
                    MenuProps={{
                      anchorOrigin: {
                        vertical: "bottom",
                        horizontal: "left",
                      },
                      transformOrigin: {
                        vertical: "top",
                        horizontal: "left",
                      },
                      getContentAnchorEl: null,
                    }}
                  >
                    {prompts.map((prompt, index) => {
                      if (index === 0) {
                        return (
                          <MenuItem
                            key={27282}
                            value={null}
                          >
                            nenhum
                          </MenuItem>
                        )
                      }
                    })}
                    {prompts.map((prompt) => (
                      <MenuItem
                        key={prompt.id}
                        value={prompt.id}
                      >
                        {prompt.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* selecionar flow */}
                <InputLabel style={{ marginTop: "20px" }}>
                  {i18n.t("whatsappModal.form.selectFlow")}
                </InputLabel>
                <Select
                  style={{ marginBottom: '20px' }}
                  labelId="dialog-select-prompt-label"
                  id="dialog-select-prompt"
                  name="flowId"
                  value={selectedFlow || ""}
                  onChange={handleChangeFlow}
                  label={i18n.t("whatsappModal.form.flow")}
                  fullWidth
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    getContentAnchorEl: null,
                  }}
                >
                  {flows.map((flow, index) => {
                    if (index === 0) {
                      return (
                        <MenuItem
                          key={27282}
                          value={null}
                        >
                          nenhum
                        </MenuItem>
                      )
                    }
                  })}
                  {flows.map((flow) => (
                    <MenuItem
                      key={flow.id}
                      value={flow.id}
                    >
                      {flow.title}
                    </MenuItem>
                  ))}
                </Select>
                <div>
                  <h3>{i18n.t("whatsappModal.form.queueRedirection")}</h3>
                  <p>{i18n.t("whatsappModal.form.queueRedirectionDesc")}</p>
                  <Grid spacing={2} container>

                    <Grid xs={6} md={6} item>
                      <FormControl
                        variant="outlined"
                        margin="dense"
                        className={classes.FormControl}
                        fullWidth
                      >
                        <InputLabel id="sendIdQueue-selection-label">
                          {i18n.t("whatsappModal.form.sendIdQueue")}
                        </InputLabel>
                        <Field
                          as={Select}
                          name="sendIdQueue"
                          id="sendIdQueue"
                          label={i18n.t("whatsappModal.form.sendIdQueue")}
                          placeholder={i18n.t("whatsappModal.form.sendIdQueue")}
                          labelId="sendIdQueue-selection-label"
                        >
                          <MenuItem value={0}>&nbsp;</MenuItem>
                          {queues.map(queue => (
                            <MenuItem key={queue.id} value={queue.id}>
                              {queue.name}
                            </MenuItem>
                          ))}
                        </Field>
                      </FormControl>

                    </Grid>

                    <Grid xs={6} md={6} item>
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.timeSendQueue")}
                        fullWidth
                        name="timeSendQueue"
                        variant="outlined"
                        margin="dense"
                        error={touched.timeSendQueue && Boolean(errors.timeSendQueue)}
                        helperText={touched.timeSendQueue && errors.timeSendQueue}
                      />
                    </Grid>

                  </Grid>
                  <Grid spacing={2} container>
                    {/* QUANTIDADE MÁXIMA DE VEZES QUE O CHATBOT VAI SER ENVIADO */}
                    <Grid xs={12} md={6} item>
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.maxUseBotQueues")}
                        fullWidth
                        name="maxUseBotQueues"
                        variant="outlined"
                        margin="dense"
                        error={touched.maxUseBotQueues && Boolean(errors.maxUseBotQueues)}
                        helperText={touched.maxUseBotQueues && errors.maxUseBotQueues}
                      />
                    </Grid>
                    {/* TEMPO PARA ENVIO DO CHATBOT */}
                    <Grid xs={12} md={6} item>
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.timeUseBotQueues")}
                        fullWidth
                        name="timeUseBotQueues"
                        variant="outlined"
                        margin="dense"
                        error={touched.timeUseBotQueues && Boolean(errors.timeUseBotQueues)}
                        helperText={touched.timeUseBotQueues && errors.timeUseBotQueues}
                      />
                    </Grid>
                  </Grid>
                  <Grid spacing={2} container>
                    {/* ENCERRAR CHATS ABERTOS APÓS X HORAS */}
                    <Grid xs={12} md={12} item>
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.expiresTicket")}
                        fullWidth
                        name="expiresTicket"
                        variant="outlined"
                        margin="dense"
                        error={touched.expiresTicket && Boolean(errors.expiresTicket)}
                        helperText={touched.expiresTicket && errors.expiresTicket}
                      />
                    </Grid>
                  </Grid>
                  {/* MENSAGEM POR INATIVIDADE*/}
                  <div>
                    <Field
                      as={TextField}
                      label={i18n.t("whatsappModal.form.expiresInactiveMessage")}
                      multiline
                      rows={4}
                      fullWidth
                      name="expiresInactiveMessage"
                      error={touched.expiresInactiveMessage && Boolean(errors.expiresInactiveMessage)}
                      helperText={touched.expiresInactiveMessage && errors.expiresInactiveMessage}
                      variant="outlined"
                      margin="dense"
                    />
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("whatsappModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {whatsAppId
                    ? i18n.t("whatsappModal.buttons.okEdit")
                    : i18n.t("whatsappModal.buttons.okAdd")}
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

export default React.memo(WhatsAppModal);
