import { BeatLoader } from "react-spinners";

interface ILoadingSpinnerProps {
  size?: number;
}

export const LoadingSpinner = ({ size }: ILoadingSpinnerProps) => (
  <div className={"flex min-h-screen items-center justify-center"}>
    <BeatLoader size={size ?? 100} color={"#358ad7"} />
  </div>
);
