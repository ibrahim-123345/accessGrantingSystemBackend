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
const{createAccessRequest,getAllAccessRequests,getAccessRequestById,updateAccessRequest,deleteAccessRequest}=require('./controllers/accessRequest');
const{createNotification,deleteNotification,getAllNotifications,getNotificationById,markAsRead}=require('./controllers/notification');
const{login, createUser}=require('./controllers/authentication')


const PORT = process.env.PORT || 5000
const app = server()


//connect to DB
connectDB()

// Middleware

app.use(cors())
app.use(server.json())


// Routes
app.post('/api/departments', createDepartment)
app.get('/api/departments', getAllDepartments)
app.get('/api/departments/:id', getDepartmentById)
app.put('/api/departments/:id', updateDepartment)
app.delete('/api/departments/:id', deleteDepartment)



//systems platform routes
app.post('/api/systemsPlatforms', createSystemsPlatform)
app.get('/api/systemsPlatforms', getAllSystemsPlatforms)
app.patch('/api/systemsPlatforms/:id',updateSystemsPlatform)
app.get('/api/systemsPlatforms/:id',getSystemsPlatformById)
app.delete('/api/systemsPlatforms/:id',deleteSystemsPlatform)



//access types routes
app.post('/api/accessTypes', createAccessType)
app.get('/api/accessTypes', getAllAccessTypes)
app.get('/api/accessTypes/:id', getAccessTypeById)
app.put('/api/accessTypes/:id', updateAccessType)
app.delete('/api/accessTypes/:id', deleteAccessType)



//employee routes
app.get('/api/employees', getAllEmployees)
app.get('/api/employees/:id', getEmployeeById)
app.post('/api/employees', createEmployee)
app.put('/api/employees/:id', updateEmployee)
app.delete('/api/employees/:id', deleteEmployee)




//access request routes
app.post('/api/accessRequests', createAccessRequest)
app.get('/api/accessRequests', getAllAccessRequests)
app.get('/api/accessRequests/:id', getAccessRequestById)
app.put('/api/accessRequests/:id', updateAccessRequest)
app.delete('/api/accessRequests/:id', deleteAccessRequest)


//notification routes
app.post('/api/notifications', createNotification)
app.get('/api/notifications', getAllNotifications)
app.get('/api/notifications/:id', getNotificationById)
app.patch('/api/notifications/:id/markAsRead', markAsRead)
app.delete('/api/notifications/:id', deleteNotification)



//authentication route
app.post('/api/login', login);
app.post('/api/register', createUser);






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})