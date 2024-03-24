import React, {useEffect, useState} from "react";
import { Chart } from 'primereact/chart';
import {styled} from "styled-components";

const CatenomicsContainer = styled.div`
    color: #fff;
    text-align: center;
    width: 80vw;
    margin: auto;

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        width: 100%;
    }

    .card {
        width: 40%;
        text-align: start;
    }

    .count {
        font-size: 5rem;
        margin: 0rem 0rem 1rem;
    }

    .chart-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;

        .chart {
            z-index: 2;
        }
        
        .center-image {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -40%);
            z-index: 1;
            display: flex;
            
            img {
                width: 100%;
                height: 100%;
                margin: auto;
            }
        }
    }



`

export const List = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    list-style: none;
    padding: 0;
`;

export const ListItem = styled.li<{ $primary?: string; }>`
    background-color: ${props => props.$primary || "#BF4F74"};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 1rem;
    width: 100%;
  
`


export function CatenomicsSection() {
    const [chartDataCircle, setChartDataCircle] = useState({});
    const [chartOptionsCircle, setChartOptionsCircle] = useState({});

    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const data = {
            datasets: [
                {
                    data: [300, 50, 100],
                    backgroundColor: ['#69489E', '#F1552E', '#107350'],
                    borderWidth: 3,
                    borderColor: '#000000',
                }
            ]
        };
        const options = {
            cutout: '65%'
        };

        setChartDataCircle(data);
        setChartOptionsCircle(options);


        const documentStyleHor = getComputedStyle(document.documentElement);
        const textColor = documentStyleHor.getPropertyValue('--text-color');
        const textColorSecondary = documentStyleHor.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyleHor.getPropertyValue('--surface-border');

    }, []);


    return (
        <CatenomicsContainer>
            <h1>Сatenomics</h1>
            <div className='content'>
                <div className="card">
                    <label>Total supply:</label>
                    <h2 className='count'>3,107,54</h2>
                    <List className="list">
                        <ListItem $primary={'#69489E'}>
                            <div>Prescale</div>
                            <div>65%</div>
                        </ListItem>
                        <ListItem $primary={'#F1552E'}>
                            <div>Airdrop</div>
                            <div>30%</div>
                        </ListItem>
                        <ListItem $primary={'#107350'}>
                            <div>Liquidity pool</div>
                            <div>5%</div>
                        </ListItem>
                    </List>
                </div>

                <div className="card flex justify-content-center circle chart-container">
                    <Chart
                        type="doughnut"
                        data={chartDataCircle}
                        options={chartOptionsCircle}
                        className="chart w-full md:w-30rem"
                    />
                    <div className="center-image">
                        <img src={require('assets/termo-cat-land/EllipseCat.png')} alt="Center Image"/>
                    </div>
                </div>
            </div>
        </CatenomicsContainer>
    );
}
