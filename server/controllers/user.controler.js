import User from "../models/userModel.js"


export const getCurrentUser = async (req, res) =>{
    try {
        const userId = req.userId
        const user = await User.findById(userId)
        if(!user){
            return res.status(400).json({
                message:"User dose not find "
            })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({
            message:`faild to get current user ${error}`
        })
    }
}