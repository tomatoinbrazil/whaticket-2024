import React, { useEffect, useState } from "react";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Title from "../Title";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import useSettings from "../../hooks/useSettings";
import { ToastContainer, toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { Tabs, Tab } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    fixedHeightPaper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        height: 240,
    },
    tab: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: 4,
        width: "100%",
        "& .MuiTab-wrapper": {
            color: theme.palette.text.primary,
        },
        "& .MuiTabs-flexContainer": {
            justifyContent: "center",
        },
    },
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        marginBottom: 12,
        width: "100%",
    },
    cardAvatar: {
        fontSize: "55px",
        color: grey[500],
        backgroundColor: "#ffffff",
        width: theme.spacing(7),
        height: theme.spacing(7),
    },
    cardTitle: {
        fontSize: "18px",
        color: blue[700],
    },
    cardSubtitle: {
        color: grey[600],
        fontSize: "14px",
    },
    alignRight: {
        textAlign: "right",
    },
    fullWidth: {
        width: "100%",
    },
    selectContainer: {
        width: "100%",
        textAlign: "left",
    },
}));

export default function PowerCRM(props) {
    const { settings, scheduleTypeChanged } = props;
    const classes = useStyles();

    const [powerCrmType, setPowerCrmType] = useState("");
    const [loadingPowerCrmType, setLoadingPowerCrmType] = useState(false);
    const [powerCrmTypeUpdated, setPowerCrmTypeUpdated] = useState(false);

    const [powerCrmTagIdType, setPowerCrmTagIdType] = useState("");
    const [loadingPowerCrmTagIdType, setLoadingPowerCrmTagIdType] = useState(false);
    const [powerCrmTagIdTypeUpdated, setPowerCrmTagIdTypeUpdated] = useState(false);

    const [tabValue, setTabValue] = useState(0);

    const { update } = useSettings();

    useEffect(() => {
        if (Array.isArray(settings) && settings.length) {
            const powerCrmType = settings.find((s) => s.key === "powercrm");
            if (powerCrmType) {
                setPowerCrmType(powerCrmType?.value);
            }
            const powerCrmTagIdType = settings.find((s) => s.key === "powercrmtagId");
            if (powerCrmTagIdType) {
                setPowerCrmTagIdType(powerCrmTagIdType?.value);
            }
        }
    }, [settings]);

    async function handleChangePowerCRM() {
        if (!powerCrmTypeUpdated) return;
        setLoadingPowerCrmType(true);
        await update({
            key: "powercrm",
            value: powerCrmType,
        });
        toast.success("Operação atualizada com sucesso.");
        setLoadingPowerCrmType(false);
        setPowerCrmTypeUpdated(false);
    }

    async function handleChangePowerCRMTagId() {
        if (!powerCrmTagIdTypeUpdated) return;
        setLoadingPowerCrmTagIdType(true);
        await update({
            key: "powercrmtagId",
            value: powerCrmTagIdType,
        });
        toast.success("Operação atualizada com sucesso.");
        setLoadingPowerCrmTagIdType(false);
        setPowerCrmTagIdTypeUpdated(false);
    }

    const handleKeyPress = async (e, updateFunction, setUpdated) => {
        if (e.key === 'Enter') {
            await updateFunction();
            setUpdated(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <>
            {/*-----------------POWER CRM-----------------*/}
            <Grid spacing={3} container style={{ marginBottom: 10 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    scrollButtons="on"
                    variant="scrollable"
                    className={classes.tab}
                >
                    <Tab label="POWER CRM" />
                </Tabs>
                <Grid xs={12} sm={12} md={12} item>
                    <FormControl className={classes.selectContainer}>
                        <TextField
                            id="powercrm"
                            name="powercrm"
                            margin="dense"
                            label="Token Power CRM"
                            variant="outlined"
                            value={powerCrmType}
                            onChange={(e) => {
                                setPowerCrmType(e.target.value);
                                setPowerCrmTypeUpdated(true);
                            }}
                            onBlur={handleChangePowerCRM}
                            onKeyPress={(e) => handleKeyPress(e, handleChangePowerCRM, setPowerCrmTypeUpdated)}
                        />
                        <FormHelperText>
                            {loadingPowerCrmType && "Atualizando..."}
                        </FormHelperText>
                    </FormControl>
                </Grid>
                {/*                 <Grid xs={12} sm={12} md={4} item>
                    <FormControl className={classes.selectContainer}>
                        <TextField
                            id="powercrmtagId"
                            name="powercrmtagId"
                            margin="dense"
                            label="Tag ID Power CRM"
                            variant="outlined"
                            value={powerCrmTagIdType}
                            onChange={(e) => {
                                setPowerCrmTagIdType(e.target.value);
                                setPowerCrmTagIdTypeUpdated(true);
                            }}
                            onBlur={handleChangePowerCRMTagId}
                            onKeyPress={(e) => handleKeyPress(e, handleChangePowerCRMTagId, setPowerCrmTagIdTypeUpdated)}
                        />
                        <FormHelperText>
                            {loadingPowerCrmTagIdType && "Atualizando..."}
                        </FormHelperText>
                    </FormControl>
                </Grid> */}
            </Grid>
            <ToastContainer />
        </>
    );
}