import OrdinalFrame from "./ordinal-frame/OrdinalFrame"
import createSparkFrame from "./SparkFrame"
import { ordinalFrameDefaults } from "./SparkFrame"

export default createSparkFrame(OrdinalFrame, ordinalFrameDefaults)
