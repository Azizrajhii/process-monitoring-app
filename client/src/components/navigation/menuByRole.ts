import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import type { UserRole } from '../../context/AuthContext';

export interface MenuItemConfig {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export const defaultDashboardByRole: Record<UserRole, string> = {
  operator: '/operator',
  quality: '/quality',
  manager: '/manager',
};

export const profilePathByRole: Record<UserRole, string> = {
  operator: '/operator/profile',
  quality: '/quality/profile',
  manager: '/manager/profile',
};

export const menuByRole: Record<UserRole, MenuItemConfig[]> = {
  operator: [
    {
      label: 'Tableau de bord',
      path: '/operator',
      icon: DashboardRoundedIcon,
    },
    {
      label: 'Processus',
      path: '/operator/processes',
      icon: PrecisionManufacturingRoundedIcon,
    },
    {
      label: 'Mes Mesures',
      path: '/operator/measurements',
      icon: ScienceRoundedIcon,
    },
    {
      label: 'Alertes',
      path: '/operator/alerts',
      icon: WarningAmberRoundedIcon,
    },
    {
      label: 'Profil',
      path: '/operator/profile',
      icon: PersonRoundedIcon,
    },
  ],
  quality: [
    {
      label: 'Tableau de bord',
      path: '/quality',
      icon: DashboardRoundedIcon,
    },
    {
      label: 'Validation',
      path: '/quality/validation',
      icon: FactCheckRoundedIcon,
    },
    {
      label: 'Alertes',
      path: '/quality/alerts',
      icon: WarningAmberRoundedIcon,
    },
    {
      label: 'Rapports',
      path: '/quality/reports',
      icon: AssessmentRoundedIcon,
    },
    {
      label: 'Audit',
      path: '/quality/audit',
      icon: HistoryRoundedIcon,
    },
  ],
  manager: [
    {
      label: 'Tableau de bord',
      path: '/manager',
      icon: DashboardRoundedIcon,
    },
    {
      label: 'Utilisateurs',
      path: '/manager/users',
      icon: PeopleAltRoundedIcon,
    },
    {
      label: 'Processus',
      path: '/manager/processes',
      icon: PrecisionManufacturingRoundedIcon,
    },
    {
      label: 'Rapports',
      path: '/manager/reports',
      icon: AssessmentRoundedIcon,
    },
    {
      label: 'Audit',
      path: '/manager/audit',
      icon: HistoryRoundedIcon,
    },
  ],
};