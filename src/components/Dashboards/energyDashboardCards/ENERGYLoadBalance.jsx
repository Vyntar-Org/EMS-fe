import { Balance, BarChart, SsidChart } from '@mui/icons-material';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import {
	Box,
	Divider,
	Grid,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	CustomProgressBar,
	MachineRatioDonut,
	MiniGaugeArc,
} from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';
import { API_URLS } from '../../../helpers/apiUrls';
import { api } from '../../../helpers/api';

const ACCENT = '#4A3AA7';

const UNITS = [
	{ value: 'A', label: 'A', title: 'Current (Amperes)' },
	{ value: 'V', label: 'V', title: 'Voltage (Volts)' },
];

const MetricBlock = memo(({ label, value, unit, showDivider, trackColor, color }) => (
    <Grid
        item
        xs={12}
        sx={{
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}
    >
        <Box>
            <ResponsiveTextWrapper
                variant="caption"
                color="text.primary"
                fontWeight={700}
                textTransform="uppercase"
                fontSize={{ xs: '9.5px' }}
                value={label}
            />
        </Box>
        <Box width="88%" display='flex' alignItems='center' gap={1} >
			<Box width='calc(100% - 40px)'>
            <CustomProgressBar
                trackColor={trackColor}
                color={color}
                value={value ?? 0}
                unit={unit || ''} hideValue
            />
			</Box>

		<Box width='40px' textAlign='right'>
				<ResponsiveTextWrapper
                variant="caption"
                color={color}
                fontWeight={1000}
                textTransform="uppercase"
                fontSize={{ xs: '9.5px' }}
                value={`${value} ${unit}`}
            />
		</Box>
        </Box>
        {showDivider && (
            <Divider
                sx={{
                    borderStyle: 'dashed',
                    height: '1px',
                    width: '100%',
                    position: 'absolute',
                    bottom: 0,
                }}
            />
        )}
    </Grid>
));

MetricBlock.displayName = 'MetricBlock';


const ENERGYLoadBalance = ({ slavesId }) => {
	const [loadBalanceData, setLoadBalanceData] = useState(null);
	const [loadType, setLoadType] = useState('A');

	const fetchLoadBalanceData = useCallback(async () => {
        try {
            const res = await api.get(
                `${API_URLS.EMS_DASHBOARD_LOAD_BALANCE}?slave_id=${slavesId || 0}`
            );
            if (res?.success) {
                setLoadBalanceData(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch load balance loadBalanceData:', error);
        }
    }, [slavesId]);


useEffect(() => {
        if (slavesId) {
            fetchLoadBalanceData();
        }
    }, [slavesId, fetchLoadBalanceData]);



const loadToggle = useMemo(
        () => (
            <ToggleButtonGroup
                value={loadType}
                exclusive
                onChange={(_e, val) => val && setLoadType(val)}
                size="small"
                aria-label="load type"
                sx={{
                    height: '28px',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '& .MuiToggleButton-root': {
                        border: 'none',
                        color: 'text.secondary',
                    },
                    '& .MuiToggleButton-root.Mui-selected': {
                        bgcolor: ACCENT,
                        color: '#FFFFFF',
                        '&:hover': { bgcolor: ACCENT },
                    },
                }}
            >
                {UNITS.map(({ value, label, title }) => (
                    <Tooltip key={value} title={title} arrow placement="top">
                        <ToggleButton value={value} aria-label={title}>
                            {label}
                        </ToggleButton>
                    </Tooltip>
                ))}
            </ToggleButtonGroup>
        ),
        [loadType]
    );

	const dataMapper = useMemo(() => {
        const isCurrent = loadType === 'A';
        const target = isCurrent ? loadBalanceData?.current : loadBalanceData?.voltage;
        const unit = target?.unit || '';

        return isCurrent
            ? {
                  one: { value: target?.ir, unit, label: 'IR' },
                  two: { value: target?.iy, unit, label: 'IY' },
                  three: { value: target?.ib, unit, label: 'IB' },
                  overall: { value: target?.lbi, unit, label: 'LBI' },
              }
            : {
                  one: { value: target?.rv, unit, label: 'RV' },
                  two: { value: target?.yv, unit, label: 'YV' },
                  three: { value: target?.bv, unit, label: 'BV' },
                  overall: { value: target?.volt_ub, unit, label: 'Volt UB' },
              };
    }, [loadType, loadBalanceData]);



	return (
		<CustomCard
			titleIcon={<Balance />}
			title="Load Balance"
			accentColor={ACCENT}
			icon={loadToggle}
		>
			{loadBalanceData ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
					}}
				>
					<Grid container sx={{ width: '100%' }} alignItems="center" rowGap={1}>
						<MetricBlock
							label={dataMapper?.one?.label}
							value={dataMapper?.one?.value}
							unit={dataMapper?.one?.unit}
							color="#D60000"
							trackColor="#FCA5A5"
						/>
						<MetricBlock
							label={dataMapper?.two?.label}
							value={dataMapper?.two?.value}
							unit={dataMapper?.two?.unit}
							color="#F59E0B"
							trackColor="#FEF3C7"
						/>
						<MetricBlock
							label={dataMapper?.three?.label}
							value={dataMapper?.three?.value}
							unit={dataMapper?.three?.unit}
							color="#0059FF"
							trackColor="#BFDBFE"
							// showDivider
						/>
					</Grid>
					<Divider
						sx={{
							borderStyle: 'dashed',
						}}
					/>

					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						width="100%"
					>
						<ResponsiveTextWrapper
							color="text.primary"
							fontWeight={700}
							fontSize="14px"
							textTransform="uppercase"
							value={dataMapper?.overall?.label}
						/>

						<Box>
							<MachineRatioDonut color={ACCENT} percent={Number(dataMapper?.overall?.value||0)} />
						</Box>
					</Box>
					{/* <Box px={0.25} pb={0.5}>
						<MiniGaugeArc percent={lbi} color={ACCENT} label="Current LBI" />
					</Box> */}
				</Box>
			) : (
				<NoDataFound message="Waiting for live device loadBalanceData — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYLoadBalance;
