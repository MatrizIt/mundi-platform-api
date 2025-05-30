import { Injectable, Inject, NotFoundException } from "@nestjs/common"
import { Repository, UpdateResult } from "typeorm"
import { Modality } from "./entities/modality.entity"
import { WorkService } from "../work/work.service"

@Injectable()
export class ModalityService {
    constructor(
        @Inject("MODALITY_REPOSITORY")
        private modalityRepository: Repository<Modality>,
        private workService: WorkService
    ) {}

    async createModality(
        workId: number,
        price: number,
        duration: number,
        title: string
    ): Promise<Modality> {
        const modality = new Modality()
        try {
            var work = await this.workService.findWork(workId)
            modality.work = work
        

        modality.title = title
        modality.price = price
        modality.duration = duration

            return await this.modalityRepository.save(modality)
        } catch (e) {
            console.log("Modality > ", e);
        }
    }

    async updateModality(modality: Modality): Promise<UpdateResult> {
        return await this.modalityRepository.update(modality.id, modality)
    }

    async deleteModality(id: number): Promise<void> {
        try {
            const result = await this.modalityRepository.delete(id);
            if (result.affected === 0) {
                throw new Error('Modalidade não encontrada');
            }
        } catch (error) {
            throw new Error(`Falha ao deletar modalidade: ${error.message}`);
        }
    }

    async deleteModalitiesByWorkId(workId: number): Promise<void> {
    await this.modalityRepository.delete({ work: { id: workId } });
}
}
