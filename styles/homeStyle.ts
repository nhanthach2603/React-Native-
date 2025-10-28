// d:\React-Native-\styles\homeStyle.ts

import { COLORS as AppColors } from './_colors';
import { authStyles as appAuthStyles } from './auth.styles';
import { chatStyles as appChatStyles } from './chatScreen.styles';
import { homeStyles as appHomeStyles } from './homeScreen.styles';
import { salesStyles as appSalesStyles } from './salesScreen.styles';
import { staffStyles as appStaffStyles } from './staffScreen.styles';
import { warehouseStyles as appWarehouseStyles } from './warehouseScreen.styles';

// --- DESIGN SYSTEM ---
export const COLORS = AppColors;

export const styles = {
  homeStyles: appHomeStyles,
  salesStyles: appSalesStyles,
  warehouseStyles: appWarehouseStyles,
  staffStyles: appStaffStyles,
  chatStyles: appChatStyles,
  authStyles: appAuthStyles,
};