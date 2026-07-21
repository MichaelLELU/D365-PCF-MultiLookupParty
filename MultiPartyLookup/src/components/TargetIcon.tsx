import * as React from "react";
import {
    BuildingRegular,
    PersonRegular,
    RecordRegular
} from "@fluentui/react-icons";
import { TargetIconName } from "../models/types";

interface Props {
    icon?: TargetIconName;
}

export const TargetIcon: React.FC<Props> = ({ icon }) => {
    if (icon === "person") {
        return <PersonRegular />;
    }

    if (icon === "building") {
        return <BuildingRegular />;
    }

    return <RecordRegular />;
};
