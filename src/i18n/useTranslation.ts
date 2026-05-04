import { useContext } from "react";
import { I18nContext } from "./i18n-context";

export const useTranslation = () => {
  return useContext(I18nContext);
};
