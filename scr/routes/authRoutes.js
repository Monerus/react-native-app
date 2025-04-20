import express from 'express'
import User from "../models/User.js"
import jwt from 'jsonwebtoken'


const router = express.Router()

const generateToken = (userId) => {
return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" })
}
router.post("/register", async (req, res) => {
    try {
        const { email, username, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Не достаточно информации" })
        }
        if (password.length < 6 ) {
            return res.status(400).json({ message: "Пароль должен быть не менее 6 символов" })
        }
        
        //Проверка пользователя, существует ли такой?

        const existing = await User.findOne({$or:[{email}, {username}]})
        if(existing) return res.status(400).json({ message: 'Пользователь уже занят' })

        const user = new User({
            email, 
            username, 
            password,
            profileImage: ""
        })
        await user.save()

        const token = generateToken(user._id)

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            }, 
        message: 'Вы успешно зарегистрировались'
        }
        )

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error', error })
    }
})

router.post("/login", async (req, res) => {
    try {
       const { email, password } = req.body 
       if (!email || !password) {
        return res.status(400).json({ message: "Не достаточно информации" })
    }


    // Поиск человека по email
    const user = await User.findOne({ email })
    if(!user) return res.status(400).json({ message: 'Неверные учетные данные' })

    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect) return res.status(400).json({ message: 'Неверные учетные данные' })

    const token = generateToken(user._id)

    res.status(200).json({
        token, 
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        },
        message: 'Вы успешно вошли'
    })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error', error })
    }
})

export default router;