import React, { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import Grid from '@material-ui/core/Grid';
import Container from "@material-ui/core/Container";
import Box from '@material-ui/core/Box';
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
    Button,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Table,
    TableHead,
    Paper,
    Tooltip,
    Typography,
    CircularProgress,
} from "@material-ui/core";
import {
    Edit,
    CheckCircle,
    SignalCellularConnectedNoInternet2Bar,
    SignalCellularConnectedNoInternet0Bar,
    SignalCellular4Bar,
    CropFree,
    DeleteOutline,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CardCounter from "../../components/Integrations/CardCounter";
import api from "../../services/api";
import AsaasIntegrationModal from "../../components/IntegrationModal/asaas";
import EvoIntegrationModal from "../../components/IntegrationModal/evo";
import SGAIntegrationModal from "../../components/IntegrationModal/sga";
import SiprovIntegrationModal from "../../components/IntegrationModal/siprov";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import GroupIcon from "@material-ui/icons/Group";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import asaas from "../../assets/asaas.png";
import sga from "../../assets/sga.png";
import evo from "../../assets/evo.png";
import siprov from "../../assets/siprov.png";

const useStyles = makeStyles(theme => ({
    mainPaper: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
    customTableCell: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    tooltip: {
        backgroundColor: "#f5f5f9",
        color: "rgba(0, 0, 0, 0.87)",
        fontSize: theme.typography.pxToRem(14),
        border: "1px solid #dadde9",
        maxWidth: 450,
    },
    tooltipPopper: {
        textAlign: "center",
    },
    buttonProgress: {
        color: green[500],
    },
}));


const Connections = () => {
    const classes = useStyles();

    const { user } = useContext(AuthContext);
    const { whatsApps, loading } = useContext(WhatsAppsContext);
    const [IntegrationModalOpen, setIntegrationModalOpen] = useState(false);
    const [IntegrationSGAModalOpen, setIntegrationSGAModalOpen] = useState(false);
    const [IntegrationEVOModalOpen, setIntegrationEVOModalOpen] = useState(false);
    const [IntegrationSiprovModalOpen, setIntegrationSiprovModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const confirmationModalInitialState = {
        action: "",
        title: "",
        message: "",
        whatsAppId: "",
        open: false,
    };
    const [confirmModalInfo, setConfirmModalInfo] = useState(
        confirmationModalInitialState
    );

    const handleStartWhatsAppSession = async whatsAppId => {
        try {
            await api.post(`/whatsappsession/${whatsAppId}`);
        } catch (err) {
            toastError(err);
        }
    };

    const handleRequestNewQrCode = async whatsAppId => {
        try {
            await api.put(`/whatsappsession/${whatsAppId}`);
        } catch (err) {
            toastError(err);
        }
    };

    const handleOpenAsaasIntegrationModal = () => {
        setIntegrationModalOpen(true);
    };

    const handleOpenSGAIntegrationModal = () => {
        setIntegrationSGAModalOpen(true);
    };

    const handleOpenEVOIntegrationModal = () => {
        setIntegrationEVOModalOpen(true);
    };

    const handleOpenSiprovIntegrationModal = () => {
        setIntegrationSiprovModalOpen(true);
    };



    const handleCloseIntegrationModal = useCallback(() => {
        setIntegrationModalOpen(false);
        setSelectedWhatsApp(null);
    }, [setSelectedWhatsApp, setIntegrationModalOpen]);


    const handleCloseSGAIntegrationModal = useCallback(() => {
        setIntegrationSGAModalOpen(false);
        setSelectedWhatsApp(null);
    }, [setSelectedWhatsApp, handleOpenSGAIntegrationModal]);

    const handleCloseEVOIntegrationModal = useCallback(() => {
        setIntegrationEVOModalOpen(false);
        setSelectedWhatsApp(null);
    }, [setSelectedWhatsApp, handleOpenEVOIntegrationModal]);

    const handleCloseSiprovIntegrationModal = useCallback(() => {
        setIntegrationSiprovModalOpen(false);
        setSelectedWhatsApp(null);
    }, [setSelectedWhatsApp, handleOpenSiprovIntegrationModal]);


    return (
        <MainContainer>
            <ConfirmationModal
                title={confirmModalInfo.title}
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
            >
                {confirmModalInfo.message}
            </ConfirmationModal>
            <QrcodeModal
                open={qrModalOpen}
                whatsAppId={!IntegrationModalOpen && selectedWhatsApp?.id}
            />
            <AsaasIntegrationModal
                open={IntegrationModalOpen}
                onClose={handleCloseIntegrationModal}
                whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
            />
            <SGAIntegrationModal
                open={IntegrationSGAModalOpen}
                onClose={handleCloseSGAIntegrationModal}
                whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
            />
            <EvoIntegrationModal
                open={IntegrationEVOModalOpen}
                onClose={handleCloseEVOIntegrationModal}
                whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
            />
            <SiprovIntegrationModal
                open={IntegrationSiprovModalOpen}
                onClose={handleCloseSiprovIntegrationModal}
                whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
            />
            <MainHeader>
                <Title>{i18n.t("integrationModal.title.name")}</Title>
            </MainHeader>

            <Container maxWidth="lg" className={classes.container}>
                <Grid container spacing={3} justifyContent="flex-start">
                    <Grid item xs={12} sm={4} md={4}
                        onClick={handleOpenAsaasIntegrationModal}>
                        <CardCounter
                            icon={asaas}
                            title="Asaas"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}
                        onClick={handleOpenSGAIntegrationModal}>
                        <CardCounter
                            icon={sga}
                            title="SGA"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}
                        onClick={handleOpenEVOIntegrationModal}>
                        <CardCounter
                            icon={evo}
                            title="EVO"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}
                        onClick={handleOpenSiprovIntegrationModal}>
                        <CardCounter
                            icon={siprov}
                            title="Siprov"
                            loading={loading}
                        />
                    </Grid>
                </Grid>
            </Container>
        </MainContainer >
    );
};

export default Connections;
