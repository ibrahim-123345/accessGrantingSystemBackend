//imports
const server = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const { connectDB } = require('./config/db')
require('./cronjobs/checkExpiry') // run cron job to check for expired access requests
const{createDepartment,deleteDepartment,getDepartmentById,getAllDepartments,updateDepartment}=require('./controllers/department')
const{createSystemsPlatform,getAllSystemsPlatforms,deleteSystemsPlatform,getSystemsPlatformById,updateSystemsPlatform}=require('./controllers/systemsPlatform');
const{getAccessTypeById,createAccessType,deleteAccessType,getAllAccessTypes,updateAccessType}=require('./controllers/accessTypes');
const{getAllEmployees,getEmployeeById,createEmployee,updateEmployee,deleteEmployee}=require('./controllers/employee');
const{createAccessRequest,getAllAccessRequests,getAccessRequestById,updateAccessRequest,deleteAccessRequest,supervisorApproval,itApproval,getAccessRequestByIdLimit,getStatitics,getStatiticsByAdmin,getPopularSystemsPlatforms}=require('./controllers/accessRequest');
const{createNotification,deleteNotification,getAllNotifications,getNotificationById,markAsRead,getNotificationsByRecipient}=require('./controllers/notification');
const{login, createUser}=require('./controllers/authentication')
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
app.post('/api/departments', createDepartment)
app.get('/api/departments',getAllDepartments)
app.get('/api/departments/:id', getDepartmentById)
app.put('/api/departments/:id', updateDepartment)
app.delete('/api/departments/:id', deleteDepartment)



//systems platform routes
app.post('/api/systemsPlatforms',createSystemsPlatform)
app.get('/api/systemsPlatforms',authenticate, getAllSystemsPlatforms)
app.patch('/api/systemsPlatforms/:id',authenticate,updateSystemsPlatform)
app.get('/api/systemsPlatforms/:id',authenticate,getSystemsPlatformById)
app.delete('/api/systemsPlatforms/:id',authenticate,deleteSystemsPlatform)



//access types routes
app.post('/api/accessTypes', createAccessType)
app.get('/api/accessTypes', getAllAccessTypes)
app.get('/api/accessTypes/:id', getAccessTypeById)
app.put('/api/accessTypes/:id',authenticate, updateAccessType)
app.delete('/api/accessTypes/:id',authenticate, deleteAccessType)



//employee routes
app.get('/api/employees',getAllEmployees)
app.get('/api/employees/:id', getEmployeeById)
app.post('/api/employees',createEmployee)
app.put('/api/employees/:id',authenticate,authorize("employee","supervisor","IT"), updateEmployee)
app.delete('/api/employees/:id',authenticate,authorize("employee","supervisor","IT"), deleteEmployee)




//access request routes
app.post('/api/accessRequests', createAccessRequest)
app.get('/api/accessRequests', authenticate,authorize("employee","supervisor","IT","admin"),getAllAccessRequests)
app.get('/api/accessRequests/:id',authenticate,authorize("employee","supervisor","IT"), getAccessRequestById)
app.put('/api/accessRequests/:id',authenticate,authorize("employee","supervisor","IT"), updateAccessRequest)
app.delete('/api/accessRequests/:id',authenticate,authorize("employee","supervisor","IT"), deleteAccessRequest)
app.post('/api/accessRequests/:id/', authenticate,authorize("supervisor"),supervisorApproval)
app.post('/api/accessRequests/:id/itApproval',authenticate,authorize("admin"), itApproval)


//notification routes
app.post('/api/notifications',authenticate, createNotification)
app.get('/api/notifications',getAllNotifications)
app.get('/api/notifications/:id',authenticate, getNotificationById)
app.patch('/api/notifications/:id/markAsRead',authenticate, markAsRead)
app.delete('/api/notifications/:id',authenticate,authorize("admin"), deleteNotification)
app.get('/api/notifications/recipient/:recipientId', getNotificationsByRecipient);
app.get('/api/statistics', getStatiticsByAdmin);
app.get('/api/accessRequests/limit/:id', authenticate,authorize("employee","supervisor","IT"), getAccessRequestByIdLimit);
app.get('/api/statistics/:id', getStatitics);
app.get('/api/popularSystemsPlatforms', getPopularSystemsPlatforms);



//authentication route
app.post('/api/login', login);
app.post('/api/register', createUser);






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})