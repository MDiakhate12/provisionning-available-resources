const express = require('express')
const cors = require('cors')
const connect = require('./config/db');
const VmInstance = require('./models/vmInstance');
const Project = require('./models/project');
const checkAvailability = require('./utils');
const axios = require('axios')

const PORT = process.env.PORT || 8080;

const app = express()

app.use(cors())

connect();

app.use(express.json())

app.get("/projects", async (req, res) => {
    try {
        let projects = await Project.find()
        console.log(projects)
        res.send(projects);
    } catch (error) {
        console.error(error)
    }
})

app.get("/projects/:projectId/instances", async (req, res) => {
    projectId = req.params.projectId
    try {
        let vmInstances = await VmInstance.find({ projectId })
        console.log(vmInstances)
        res.send(vmInstances);
    } catch (error) {
        console.error(error)
    }
})

app.get("/", async (req, res) => {
    try {
        let vmInstances = await VmInstance.find().populate('projectId')
        console.log(vmInstances)
        res.send(vmInstances);
    } catch (error) {
        console.error(error)
    }

})

app.post("/provider-list", async (req, res) => {
    const {
        projectName,
        applicationType,
        dependencies,
        SLA,
        environment,
        dataSize,
        connectedApplications,
        techRequirements,
        costEstimation,
        name,
        cpu,
        memory,
        disk,
        osType,
        osImage,
        numberOfVm,
    } = req.body

    // GET PROVIDER ORIENTATION
    try {
        let providers = (await axios.post('http://faas-cloud-orientation.mouhammad.ml/projects', req.body)).data
        console.log(providers)
        res.send(providers)
    } catch (error) {
        return sendError(error)
    }

})

app.post("/", async (req, res) => {

    const {
        projectName,
        applicationType,
        dependencies,
        SLA,
        environment,
        dataSize,
        connectedApplications,
        techRequirements,
        costEstimation,
        name,
        cpu,
        memory,
        disk,
        osType,
        osImage,
        numberOfVm,
        provider
    } = req.body

    // GET REQUESTED RESOURCES
    console.log("REQUESTED RESOURCES: ", req.body)
    console.log("\n")

    // GET AVAILABLE RESOURCES
    const resources = await checkAvailability(numberOfVm * cpu, numberOfVm * memory, numberOfVm * disk)
    console.log("AVAILABLE RESOURCES: ", resources)

    // SAVE PROJECT ON DATABASE
    if (resources.available) {
        try {
            // let os = await OsImage.findOne({ image: osImage, type: osType }).id

            let newProject = new Project({
                projectName,
                applicationType,
                dependencies,
                SLA,
                environment,
                dataSize,
                connectedApplications,
                techRequirements,
                costEstimation,
                provider
            })

            projectId = (await newProject.save())._id

            let newInstance = new VmInstance({
                name,
                cpu,
                memory,
                disk,
                osType,
                osImage,
                projectId
            })

            newInstance = await newInstance.save()
            return res.status(201).send(newInstance)
        } catch (error) {
             return sendError(error)
        }
    } else {
        return res.send("Insufficient ressources")
    }
})

app.listen(PORT, () => {
    console.log("Listenning on port ", PORT)
})

const sendError = (error) => {
    console.error(error.message)
    return res.status(500).send("Server error")
}