//imports
const server = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const { connectDB } = require('./config/db')
require('./cronjobs/checkExpiry') // run cron job to check for expired access requests
const{createDepartment,deleteDepartment,getDepartmentById,getAllDepartments,updateDepartment}=require('./controllers/department')
const{createSystemsPlatform,getAllSystemsPlatforms,deleteSystemsPlatform,getSystemsPlatformById,updateSystemsPlatform,getSystemDetails}=require('./controllers/systemsPlatform');
const{getAccessTypeById,createAccessType,deleteAccessType,getAllAccessTypes,updateAccessType}=require('./controllers/accessTypes');
const{getAllEmployees,getEmployeeById,createEmployee,updateEmployee,deleteEmployee}=require('./controllers/employee');
const{createAccessRequest,getAllAccessRequests,getAccessRequestById,updateAccessRequest,deleteAccessRequest,supervisorApproval,itApproval,getStatitics,getStatiticsByAdmin,getAccessRequestsByEmployeeId,getPopularSystemsPlatforms, getAccessRequestLimit,getSupervisorTeamWithRequests}=require('./controllers/accessRequest');
const{createNotification,deleteNotification,getNotificationCountsByEmail,getAllNotifications,getNotificationById,markAsRead,getNotificationsByRecipient}=require('./controllers/notification');
const{login, createUser,deSeeding}=require('./controllers/authentication')
const { authenticate } = require('./middlewares/auth');
const { authorize } = require('./middlewares/authorization');




const PORT = process.env.PORT || 5000
const app = server()


//connect to DB
connectDB()

// Middleware

app.use(cors())
app.use(server.json())


// Routes
app.post('/api/departments',authenticate, createDepartment)
app.get('/api/departments',authenticate,getAllDepartments)
app.get('/api/departments/:id',authenticate, getDepartmentById)
app.put('/api/departments/:id',authenticate, updateDepartment)
app.delete('/api/departments/:id',authenticate, deleteDepartment)



//systems platform routes
app.post('/api/systemsPlatforms',authenticate,createSystemsPlatform)
app.get('/api/systemsPlatforms', authenticate,getAllSystemsPlatforms)
app.patch('/api/systemsPlatforms/:id',authenticate,updateSystemsPlatform)
app.get('/api/systemsPlatforms/:id',authenticate,getSystemsPlatformById)
app.delete('/api/systemsPlatforms/:id',authenticate,deleteSystemsPlatform)
app.get('/api/systemFullDetails/:systemId',authenticate,getSystemDetails)



//access types routes
app.post('/api/accessTypes',authenticate, createAccessType)
app.get('/api/accessTypes',authenticate, getAllAccessTypes)
app.get('/api/accessTypes/:id',authenticate, getAccessTypeById)
app.put('/api/accessTypes/:id',authenticate, updateAccessType)
app.delete('/api/accessTypes/:id',authenticate, deleteAccessType)



//employee routes
app.get('/api/employees',authenticate,getAllEmployees)
app.get('/api/employees/:id',authenticate, getEmployeeById)
app.post('/api/employees',authenticate,createEmployee)
app.put('/api/employees/:id',authenticate,authorize("employee","supervisor","IT"), updateEmployee)
app.delete('/api/employees/:id',authenticate,authorize("employee","supervisor","IT"), deleteEmployee)




//access request routes
app.post('/api/accessRequests',authenticate,authorize("employee","supervisor"), createAccessRequest)
app.get('/api/accessRequests',authorize("employee","supervisor"),getAllAccessRequests)
app.get('/api/accessRequests/:id', authorize("employee","supervisor"),getAccessRequestById)
app.put('/api/accessRequests/:id',authenticate,authorize("employee","supervisor","IT"), updateAccessRequest)
app.delete('/api/accessRequests/:id',authenticate,authorize("employee","supervisor","IT"), deleteAccessRequest)
app.post('/api/accessRequests/:id/', authenticate,authorize("supervisor"),supervisorApproval)
app.post('/api/accessRequests/:id/itApproval',authorize("admin"), itApproval)
app.get('/api/statistics', authenticate,getStatiticsByAdmin);
app.get('/api/accessRequestsLimit', getAccessRequestLimit);
app.get('/api/statistics/:employeeId',authenticate, getStatitics);
app.get('/api/popularSystemsPlatforms',authenticate, getPopularSystemsPlatforms);
app.get('/api/getStatisticsByAdmin',authenticate, getStatiticsByAdmin);
app.get('/api/accessRequests/employee/:userId',authenticate, getAccessRequestsByEmployeeId);
app.get('/api/supervisorDashboard/:id',authenticate, getSupervisorTeamWithRequests)
app.put('/api/supervisorApproaval/:id',authenticate,authorize("supervisor"), supervisorApproval)



//notification routes
app.post('/api/notifications',authenticate, createNotification)
app.get('/api/notifications',authenticate,getAllNotifications)
app.get('/api/notifications/:id',authenticate, getNotificationById)
app.patch('/api/notifications/:id/markAsRead',authenticate, markAsRead)
app.delete('/api/notifications/:id',authenticate, deleteNotification)
app.get('/api/notifications/recipient/:recipientId',authenticate, getNotificationsByRecipient);
app.get('/api/notificationByEmail/:email',authenticate,getNotificationCountsByEmail)



//dont touch this if your uncertain
app.delete('/api/deseed',authenticate,authorize("admin"),deSeeding)




//authentication route
app.post('/api/login', login);
app.post('/api/register', createUser);






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})