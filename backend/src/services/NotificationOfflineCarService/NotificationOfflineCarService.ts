import axios from "axios";
import moment from "moment";

import QueueIntegrations from "../../models/QueueIntegrations";
import { logger } from "../../utils/logger";


type IDtIntegration = {
  imei: string;
  // no_not_notify_until: string;
  text?: string;
}
type IIntegration = {
  type: string;
  data: IDtIntegration;
  response: string;
  companyId: number;
  externalUrl?: string;
  no_not_notify_until: string,
}

const NotificationOfflineCarService = async ({
    type,
    data,
    response,
    companyId,
    externalUrl,
    no_not_notify_until,
}: IIntegration): Promise<boolean> => {
    try {

      console.log({
        logType: 'NotificationOfflineCarService',
        type,
        data,
        response,
        companyId,
        externalUrl,
      })
      const date = moment().add(Number(no_not_notify_until) || 1, 'day').format('YYYY-MM-DDTHH:mm')
      const dateFormat = moment(date).format("YYYY-MM-DD")

      const config = {
          method: 'post',
          url: `${externalUrl}/maintenance_update/${data.imei}`,
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          data: {
            no_not_notify_until: dateFormat,
            maintenance_reason: response,
          },
      };

      const request = await axios.request(config);

      const devices = request.data;
      console.log({devices})
      return true

    } catch (error) {
        logger.info("Error on NotificationOfflineCarService: ", error);
        return false
    }
}

export default NotificationOfflineCarService;
