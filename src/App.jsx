import { BrowserRouter } from 'react-router-dom';

import { ToastProvider } from './components/common/PremiumToast';
import WaterMonitoringMotorOperations from './components/WaterMonitoring/WaterMonitoringMotorOperations';
import { ApplicationProvider } from './contexts/ApplicationContext';
import { AuthProvider } from './contexts/AuthContext';
import { CommonDataContextProvider } from './contexts/CommonDataContext';
import { AppRoutes } from './routes/AppRoutes';

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<ApplicationProvider>
					<CommonDataContextProvider>
						<ToastProvider>
							<WaterMonitoringMotorOperations>
								<AppRoutes />
							</WaterMonitoringMotorOperations>
						</ToastProvider>
					</CommonDataContextProvider>
				</ApplicationProvider>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
