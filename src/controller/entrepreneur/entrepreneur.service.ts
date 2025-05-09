import {
    Injectable,
    Inject,
    HttpStatus,
    HttpException,
    NotFoundException
} from "@nestjs/common"
import { ResultDto } from "src/dto/result.dto"
import { CreateEntrepreneurDto } from "./dto/create-entrepreneur.dto"
import { Entrepreneur } from "./entities/entrepreneur.entity"
import { Repository } from "typeorm"
import * as bcrypt from "bcrypt"
import { Work } from "../work/entities/work.entity"
import { Category } from "../category/entities/category.entity"
import { Schedule } from "../scheduling/entities/scheduling.entity"
import { Image } from "../uploads/entities/upload.entity"

@Injectable()
export class EntrepreneurService {
    constructor(
        @Inject("ENTREPRENEUR_REPOSITORY")
        private entrepreneurRepository: Repository<Entrepreneur>
    ) {}

    async findAll(): Promise<Entrepreneur[]> {
        return this.entrepreneurRepository.find({
            relations: [
                "category",
                "avaliation",
                "work",
                "images",
                "schedulling"
            ]
        })
    }

    async register(data: CreateEntrepreneurDto): Promise<ResultDto> {
        const payload = { sub: data.email, username: data.doc }

        if (data.password === null) {
            return <ResultDto>{
                status: false,
                mensagem: "Campo senha é obrigatorio!"
            }
        }

        const existingEmailUser = await this.entrepreneurRepository.findOne({
            where: { email: data.email }
        })

        if (existingEmailUser) {
            throw new HttpException(
                { status: false, mensagem: "Email já está em uso!" },
                HttpStatus.BAD_REQUEST
            )
        }

        const existingDocUser = await this.entrepreneurRepository.findOne({
            where: { doc: data.doc }
        })

        if (existingDocUser) {
            throw new HttpException(
                { status: false, mensagem: "CPF já está em uso!" },
                HttpStatus.BAD_REQUEST
            )
        }
        if (data.address == null) {
            throw new HttpException(
                { status: false, mensagem: "Campo endereco e obrigatorio!" },
                HttpStatus.BAD_REQUEST
            )
        }

        if (data.companyName == null) {
            throw new HttpException(
                {
                    status: false,
                    mensagem: "Campo nome da empresa e obrigatorio!"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        if (data.name == null) {
            throw new HttpException(
                { status: false, mensagem: "Campo nome e obrigatorio!" },
                HttpStatus.BAD_REQUEST
            )
        }

        if (data.addressNumber == null) {
            throw new HttpException(
                {
                    status: false,
                    mensagem: "Campo numero de endereco e obrigatorio!"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        if (data.cep == null) {
            throw new HttpException(
                {
                    status: false,
                    mensagem: "Campo cep e obrigatorio!"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        if (data.city == null) {
            throw new HttpException(
                {
                    status: false,
                    mensagem: "Campo cidade e obrigatorio!"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        if (data.state == null) {
            throw new HttpException(
                {
                    status: false,
                    mensagem: "Campo estado e obrigatorio!"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        const entrepreneur = new Entrepreneur()

        entrepreneur.name = data.name
        entrepreneur.email = data.email
        entrepreneur.password = bcrypt.hashSync(data.password, 8)
        entrepreneur.doc = data.doc
        entrepreneur.phone = data.phone
        entrepreneur.companyName = data.companyName
        entrepreneur.optionwork = data.optionwork
        entrepreneur.address = data.address
        entrepreneur.addressNumber = data.addressNumber
        entrepreneur.cep = data.cep
        entrepreneur.city = data.city
        entrepreneur.state = data.state
        entrepreneur.deslocation = data.deslocation
        entrepreneur.valueDeslocation = data.valueDeslocation
        entrepreneur.operation = data.operation
        entrepreneur.status = data.status

        /*const fileName = `${Date.now()}-${data.image.originalname}`;


        const base64Image = data.image.buffer.toString("base64");

        const imageEntity = new Image();
        imageEntity.filename = fileName;
        imageEntity.base64 = base64Image;
        imageEntity.entrepreneur = entrepreneur;

        await this.imageRepository.save(imageEntity);*/

        return await this.entrepreneurRepository
            .save(entrepreneur)
            .then(async (result) => {
                return <ResultDto>{
                    status: true,
                    mensagem: "Cadastro feito com sucesso!",
                    entrepreneurId: result.entrepreneurId
                }
            })
            .catch((error) => {
                return <ResultDto>{
                    status: false,
                    mensagem: "Erro ao cadastrar!"
                }
            })
    }

    async getUserById(
        entrepreneurId: number
    ): Promise<Entrepreneur | undefined> {
        return this.entrepreneurRepository.findOne({
            where: { entrepreneurId }
        })
    }

    async updateUser(
        entrepreneurId: number,
        updateUserDto: Entrepreneur
    ): Promise<Entrepreneur> {
        const entrepreneur = await this.getUserById(entrepreneurId)
        if (!entrepreneur) {
            throw new HttpException(
                {
                    status: HttpStatus.BAD_REQUEST,
                    error: "Usuario nao encontrado"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        entrepreneur.name = updateUserDto.name
        entrepreneur.email = updateUserDto.email
        entrepreneur.password = updateUserDto.password
        entrepreneur.doc = updateUserDto.doc
        entrepreneur.phone = updateUserDto.phone
        entrepreneur.companyName = updateUserDto.companyName
        entrepreneur.optionwork = updateUserDto.optionwork
        entrepreneur.address = updateUserDto.address
        entrepreneur.addressNumber = updateUserDto.addressNumber
        entrepreneur.cep = updateUserDto.cep
        entrepreneur.city = updateUserDto.city
        entrepreneur.state = updateUserDto.state
        entrepreneur.deslocation = updateUserDto.deslocation
        entrepreneur.valueDeslocation = updateUserDto.valueDeslocation
        entrepreneur.operation = updateUserDto.operation
        entrepreneur.work = updateUserDto.work
        return this.entrepreneurRepository.save(entrepreneur)
    }

    async findOneByEmail(email: string): Promise<Entrepreneur | null> {
        return this.entrepreneurRepository.findOne({ where: { email } })
    }

    async findOneByCpf(doc: string): Promise<Entrepreneur | null> {
        return this.entrepreneurRepository.findOne({ where: { doc } })
    }

    async findOneById(entrepreneurId: number): Promise<Entrepreneur | null> {
        const entrepreneur = await this.entrepreneurRepository
            .createQueryBuilder()
            .select(`getEntrepreneurData(${entrepreneurId})`, "entrepreneur")
            .getRawOne()

        return entrepreneur.entrepreneur
    }

    async deleteUser(entrepreneurId: number): Promise<void> {
        const entrepreneur = await this.getUserById(entrepreneurId)
        if (!entrepreneur) {
            throw new HttpException(
                {
                    status: HttpStatus.BAD_REQUEST,
                    error: "Usuario nao encontrado"
                },
                HttpStatus.BAD_REQUEST
            )
        }
        await this.entrepreneurRepository.remove(entrepreneur)
    }

    async updateWork(id: number, workData: Partial<Work[]>): Promise<void> {
        try {
            const entrepreneur = await this.entrepreneurRepository
                .createQueryBuilder("entrepreneur")
                .leftJoinAndSelect("entrepreneur.work", "work")
                .where("entrepreneur.entrepreneurId = :id", { id })
                .getOne()

            if (!entrepreneur) {
                throw new NotFoundException("Entrepreneur not found")
            }

            console.log("Work > ", workData)

            entrepreneur.work = [...workData] // Substitui todos os trabalhos antigos pelos novos

            await this.entrepreneurRepository.save(entrepreneur)
        } catch (e) {
            console.log("Ero update > ", e)
        }
    }

    async updateCategory(
        id: number,
        categoryData: Partial<Category[]>
    ): Promise<void> {
        const entrepreneur = await this.entrepreneurRepository
            .createQueryBuilder("entrepreneur")
            .leftJoinAndSelect("entrepreneur.category", "category")
            .where("entrepreneur.entrepreneurId = :id", { id })
            .getOne()

        if (!entrepreneur) {
            throw new NotFoundException("Entrepreneur not found")
        }

        entrepreneur.category = [...categoryData] // Substitui todas as categorias anteriores pelas novas

        await this.entrepreneurRepository.save(entrepreneur)
    }

    async updateSchedule(
        id: number,
        scheduleData: Partial<Schedule[]>
    ): Promise<void> {
        const entrepreneur = await this.entrepreneurRepository
            .createQueryBuilder("entrepreneur")
            .leftJoinAndSelect("entrepreneur.schedulling", "schedulling")
            .where("entrepreneur.entrepreneurId = :id", { id })
            .getOne()

        if (!entrepreneur) {
            throw new NotFoundException("Entrepreneur not found")
        }

        entrepreneur.schedulling = [...scheduleData] // Substitui todos os agendamentos anteriores pelos novos

        await this.entrepreneurRepository.save(entrepreneur)
    }

    generateResetCode(): string {
        let code = ""
        for (let i = 0; i < 8; i++) {
            code += Math.floor(Math.random() * 10) // Gera um número aleatório entre 0 e 9
        }
        return code
    }

    async setResetPasswordCode(email: string, code: string): Promise<void> {
        const user = await this.entrepreneurRepository.findOne({ where: { email } })
        if (!user) {
            throw new HttpException(
                "Usuário não encontrado",
                HttpStatus.NOT_FOUND
            )
        }

        user.resetPasswordCode = code
        user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hora de expiração
        await this.entrepreneurRepository.save(user)
    }

    async validateResetPasswordCode(
        email: string,
        code: string
    ): Promise<boolean> {
        const user = await this.entrepreneurRepository.findOne({ where: { email } })
        if (
            !user ||
            user.resetPasswordCode !== code ||
            user.resetPasswordExpires < new Date()
        ) {
            return false
        }
        return true
    }

    async clearResetPasswordCode(email: string): Promise<void> {
        const entrepreneur = await this.entrepreneurRepository.findOne({ where: { email } })
        if (entrepreneur) {
            entrepreneur.resetPasswordCode = null
            entrepreneur.resetPasswordExpires = null
            await this.entrepreneurRepository.save(entrepreneur)
        }
    }
}
