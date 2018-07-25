import NetworkFrame from "./network-frame/NetworkFrame"
import createSparkFrame from "./SparkFrame"
import { networkFrameDefaults } from "./SparkFrame"

export default createSparkFrame(NetworkFrame, networkFrameDefaults)
